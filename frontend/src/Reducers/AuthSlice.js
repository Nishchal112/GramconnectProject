import { createAsyncThunk, createSlice, isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = "https://gramconnectproject.onrender.com/api/auth";

export const loginUser = createAsyncThunk(
    "auth/login",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/login`, userData);
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchUser = createAsyncThunk(
    "auth/fetchUser",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/me`);
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await axios.post(`${API_URL}/logout`);
            return null;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Renamed thunk to "auth/updateProfile" for clarity; backend now returns { message, user }
export const updateProfile = createAsyncThunk(
    "auth/updateProfile",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/edit-profile`, userData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = { user: null, status: "idle", error: null };

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addMatcher(isPending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addMatcher(isFulfilled, (state, action) => {
                state.status = "succeeded";
                // Update state.user based on the fulfilled action type
                switch (action.type) {
                    case loginUser.fulfilled.toString():
                    case fetchUser.fulfilled.toString():
                        state.user = action.payload;
                        break;
                    case updateProfile.fulfilled.toString():
                        // updateProfile returns { message, user }
                        state.user = action.payload.user;
                        break;
                    case logoutUser.fulfilled.toString():
                        state.user = null;
                        break;
                    default:
                        break;
                }
            })
            .addMatcher(isRejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            });
    }
});

export default authSlice.reducer;
