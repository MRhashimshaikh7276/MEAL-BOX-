import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminAPI } from '../../services/api'
import { initializeSocket, disconnectSocket, joinAdminRoom } from '../../services/socket'

export const fetchDashboard = createAsyncThunk('admin/dashboard', async (_, { rejectWithValue }) => {
  try { return (await adminAPI.getDashboard()).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const fetchAllUsers = createAsyncThunk('admin/users', async (_, { rejectWithValue }) => {
  try { return (await adminAPI.getUsers()).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const fetchAllOrders = createAsyncThunk('admin/orders', async (_, { rejectWithValue }) => {
  try {
    // prefer the orders/admin/all route, fallback to /admin/orders
    const res = await adminAPI.getAllOrders().catch(() => adminAPI.getOrders());
    return res.data
  } catch (err) { return rejectWithValue(err.response?.data) }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState: { dashboard: null, users: [], orders: [], loading: false, socket: null },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    initializeSocketConnection: (state, action) => {
      const { token } = action.payload;
      const socket = initializeSocket(token);
      state.socket = socket;
      joinAdminRoom();
    },
    disconnectSocketConnection: (state) => {
      disconnectSocket();
      state.socket = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.dashboard = action.payload })
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.users = action.payload.users || [] })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.orders = action.payload.orders || [] })
  }
})
export const { setSocket, initializeSocketConnection, disconnectSocketConnection } = adminSlice.actions
export default adminSlice.reducer
