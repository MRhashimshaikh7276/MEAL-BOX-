import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { addOnesAPI } from '../../services/api'

export const fetchAddOnes = createAsyncThunk('addOnes/fetch', async (_, { rejectWithValue }) => {
  try { return (await addOnesAPI.getAll()).data } catch (err) { return rejectWithValue(err.response?.data) }
})

export const fetchAddOnesByProduct = createAsyncThunk('addOnes/fetchByProduct', async (productId, { rejectWithValue }) => {
  try { return (await addOnesAPI.getByProduct(productId)).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const addOnesSlice = createSlice({
  name: 'addOnes',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddOnes.pending, (state) => { state.loading = true })
      .addCase(fetchAddOnes.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.addOnes?.filter(a => a.isAvailable) || []
      })
      .addCase(fetchAddOnes.rejected, (state) => { state.loading = false })
      .addCase(fetchAddOnesByProduct.pending, (state) => { state.loading = true })
      .addCase(fetchAddOnesByProduct.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.addOnes?.filter(a => a.isAvailable) || []
      })
      .addCase(fetchAddOnesByProduct.rejected, (state) => { state.loading = false })
  }
})

export default addOnesSlice.reducer
