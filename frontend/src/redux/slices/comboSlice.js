import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { comboAPI } from '../../services/api'

export const fetchCombos = createAsyncThunk(
  'combos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return (await comboAPI.getAll()).data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

const comboSlice = createSlice({
  name: 'combos',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCombos.pending, (state) => { state.loading = true })
      .addCase(fetchCombos.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.combos || []
      })
      .addCase(fetchCombos.rejected, (state) => { state.loading = false })
  }
})

export default comboSlice.reducer
