import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoryAPI } from '../../services/api'

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try { return (await categoryAPI.getAll()).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const categorySlice = createSlice({
  name: 'categories',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.categories || [] })
      .addCase(fetchCategories.rejected, (state) => { state.loading = false })
  }
})
export default categorySlice.reducer
