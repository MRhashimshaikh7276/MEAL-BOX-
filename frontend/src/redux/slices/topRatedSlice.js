import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productAPI } from '../../services/api'

export const fetchTopRatedProducts = createAsyncThunk('topRated/fetchAll', async (params = {}, { rejectWithValue }) => {
  try { 
    const res = await productAPI.getAll({ ...params, limit: 12, sort: 'rating' })
    return res.data 
  } catch (err) { 
    return rejectWithValue(err.response?.data) 
  }
})

const topRatedSlice = createSlice({
  name: 'topRated',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopRatedProducts.pending, (state) => { state.loading = true })
      .addCase(fetchTopRatedProducts.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.products || []
      })
      .addCase(fetchTopRatedProducts.rejected, (state) => { state.loading = false })
  }
})

export default topRatedSlice.reducer
