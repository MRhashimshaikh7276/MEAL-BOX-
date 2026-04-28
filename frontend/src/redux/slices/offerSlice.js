import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { offerAPI } from '../../services/api'

export const fetchOffers = createAsyncThunk('offers/fetchAll', async (_, { rejectWithValue }) => {
  try { return (await offerAPI.getAll()).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const offerSlice = createSlice({
  name: 'offers',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => { state.loading = true })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.offers || []
      })
      .addCase(fetchOffers.rejected, (state) => { state.loading = false })
  }
})

export default offerSlice.reducer
