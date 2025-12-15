import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

axios.defaults.withCredentials = true;
const API_URL = "https://gramconnectproject.onrender.com/api";

const initialState = {
    initiativeData: [],
    status: 'idle',
    error: null,
};

export const fetchInitiative = createAsyncThunk(
    'initiative/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`${API_URL}/initiatives/`);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const voteInitiative = createAsyncThunk(
    'initiative/voteInitiative',
    async ({ initiativeId, userId }, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(`${API_URL}/initiatives/vote/${initiativeId}`, { userId });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const addInitiative = createAsyncThunk(
    'initiative/addInitiative',
    async (initiativeData, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(
                `${API_URL}/initiatives/`,
                initiativeData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            // Backend returns an initiative with an "imageUrl" property from S3.
            return data.initiative;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const commentInitiative = createAsyncThunk(
    'initiative/commentInitiative',
    async ({ initiativeId, userId, comment, tempId }, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(
                `${API_URL}/initiatives/comment/${initiativeId}`,
                { userId, comment }
            );
            // Assume the backend returns the full comment data (e.g., with a permanent _id).
            const newComment = data.comments ? data.comments[data.comments.length - 1] : data.comment;
            return { initiativeId, tempId, comment: newComment };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initiativeSlice = createSlice({
    name: 'initiative',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInitiative.fulfilled, (state, action) => {
                state.initiativeData = action.payload;
                state.status = 'succeeded';
            })
            .addCase(voteInitiative.pending, (state, action) => {
                const { initiativeId, userId } = action.meta.arg;
                const initiative = state.initiativeData.find(item => item._id === initiativeId);
                if (initiative) {
                    if (!initiative.likedBy.includes(userId)) {
                        initiative.voteCount = (initiative.voteCount || 0) + 1;
                        initiative.likedBy.push(userId);
                    } else {
                        initiative.voteCount = (initiative.voteCount || 0) - 1;
                        initiative.likedBy = initiative.likedBy.filter(id => id !== userId);
                    }
                }
                state.status = 'loading';
                state.error = null;
            })
            .addCase(voteInitiative.fulfilled, (state, action) => {
                const { initiativeId, voteCount, likedBy } = action.payload;
                const initiative = state.initiativeData.find(item => item._id === initiativeId);
                if (initiative) {
                    initiative.voteCount = voteCount;
                    initiative.likedBy = likedBy;
                }
                state.status = 'succeeded';
            })
            .addCase(voteInitiative.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            .addCase(addInitiative.fulfilled, (state, action) => {
                state.initiativeData.unshift(action.payload);
                state.status = 'succeeded';
            })
            // Optimistic update for commenting:
            .addCase(commentInitiative.pending, (state, action) => {
                const { initiativeId, userId, comment, tempId } = action.meta.arg;
                const initiative = state.initiativeData.find(item => item._id === initiativeId);
                if (initiative) {
                    // Add a temporary comment
                    const newComment = { _id: tempId, userId, comment, optimistic: true };
                    initiative.comments = initiative.comments ? [...initiative.comments, newComment] : [newComment];
                    initiative.commentCount = initiative.comments.length;
                }
                state.status = 'loading';
                state.error = null;
            })
            .addCase(commentInitiative.fulfilled, (state, action) => {
                const { initiativeId, tempId, comment } = action.payload;
                const initiative = state.initiativeData.find(item => item._id === initiativeId);
                if (initiative && initiative.comments) {
                    // Replace the optimistic comment with the confirmed comment from the server.
                    initiative.comments = initiative.comments.map(c => c._id === tempId ? comment : c);
                    initiative.commentCount = initiative.comments.length;
                }
                state.status = 'succeeded';
            })
            .addCase(commentInitiative.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            .addMatcher(
                (action) => action.type.endsWith('/rejected'),
                (state, action) => {
                    state.status = 'failed';
                    state.error = action.payload || action.error.message;
                }
            );
    }
});

export default initiativeSlice.reducer;
