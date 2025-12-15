import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

const initialState = {
    Schemes: []
}

export const getAllScheme = createAsyncThunk(
    "schemes/getAll",
    async () => {
        try {
            const { data } = await axios.get("https://gramconnectproject.onrender.com/api/schemes/schemes");
            return data;
        } catch (error) {
            console.log(error)
        }
    }
)

export const getFilteredScheme = createAsyncThunk(
    "schemes/filter",
    async (filterString) => {
        try {
            const { data } = await axios.get(`http://localhost:3000/api/schemes/schemes/filter?${filterString}`);
            return data;
        } catch (error) {
            console.log(error)
        }
    }
)

export const SchemeSlice = createSlice({
    name: "Schemes",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllScheme.fulfilled, (state, action) => {
                state.Schemes = action.payload
            })
            .addCase(getFilteredScheme.fulfilled, (state, action) => {
                state.Schemes = action.payload
            })
    }
})

export default SchemeSlice.reducer
