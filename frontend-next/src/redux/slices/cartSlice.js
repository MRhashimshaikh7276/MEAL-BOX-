import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartAPI } from '../../services/api'
import toast from 'react-hot-toast'

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { return (await cartAPI.getCart()).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const addToCart = createAsyncThunk('cart/add', async (data, { rejectWithValue }) => {
  try { const res = await cartAPI.addToCart(data); toast.success('Added to cart! 🛒'); return res.data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const updateCartItem = createAsyncThunk('cart/update', async (data, { rejectWithValue }) => {
  try { return (await cartAPI.updateCart(data)).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const removeFromCart = createAsyncThunk('cart/remove', async ({ productId, comboId }, { rejectWithValue }) => {
  try { toast.success('Removed from cart'); return (await cartAPI.removeFromCart(productId, comboId)).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], totalAmount: 0, loading: false, isOpen: false },
  reducers: {
    toggleCart: (state) => { state.isOpen = !state.isOpen },
    openCart: (state) => { state.isOpen = true },
    closeCart: (state) => { state.isOpen = false },
    clearCart: (state) => { state.items = []; state.totalAmount = 0 },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || []
        state.totalAmount = action.payload.cart?.totalAmount || 0
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || []
        state.totalAmount = action.payload.cart?.totalAmount || 0
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || []
        state.totalAmount = action.payload.cart?.totalAmount || 0
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || []
        state.totalAmount = action.payload.cart?.totalAmount || 0
      })
  }
})

export const { toggleCart, openCart, closeCart, clearCart } = cartSlice.actions
export default cartSlice.reducer
