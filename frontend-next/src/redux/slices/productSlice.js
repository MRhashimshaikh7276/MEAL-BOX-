import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productAPI } from '../../services/api'

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try { return (await productAPI.getAll(params)).data } catch (err) { return rejectWithValue(err.response?.data) }
})
export const fetchProductById = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await productAPI.getById(id)).data } catch (err) { return rejectWithValue(err.response?.data) }
})

const productSlice = createSlice({
  name: 'products',
  initialState: { list: [], product: null, loading: false, error: null, pagination: {}, filters: { category: '', search: '', sort: 'popular', isVeg: '' } },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload } },
    clearProduct: (state) => { state.product = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.products
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchProductById.pending, (state) => { state.loading = true })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.loading = false; state.product = action.payload.product })
      .addCase(fetchProductById.rejected, (state) => { state.loading = false })
  }
})

export const { setFilters, clearProduct } = productSlice.actions
export default productSlice.reducer
