import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { orderAPI } from '../../services/api'
import toast from 'react-hot-toast'

export const placeOrder = createAsyncThunk('orders/place', async (data, { rejectWithValue }) => {
  try { const res = await orderAPI.place(data); toast.success('Order placed! 🎉'); return res.data } catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data) }
})
export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async (_, { rejectWithValue }) => {
  try { return (await orderAPI.getMyOrders()).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const fetchOrderById = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await orderAPI.getById(id)).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const orderSlice = createSlice({
  name: 'orders',
  initialState: { list: [], order: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => { state.loading = true })
      .addCase(placeOrder.fulfilled, (state, action) => { state.loading = false; state.order = action.payload.order })
      .addCase(placeOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.orders })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.order = action.payload.order })
  }
})
export default orderSlice.reducer
