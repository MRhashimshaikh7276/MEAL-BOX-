import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import productReducer from './slices/productSlice'
import orderReducer from './slices/orderSlice'
import categoryReducer from './slices/categorySlice'
import uiReducer from './slices/uiSlice'
import adminReducer from './slices/adminSlice'
import offerReducer from './slices/offerSlice'
import topRatedReducer from './slices/topRatedSlice'
import comboReducer from './slices/comboSlice'
import bannerReducer from './slices/bannerSlice'
import addOnesReducer from './slices/addOnesSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    categories: categoryReducer,
    banners: bannerReducer,
    offers: offerReducer,
    combos: comboReducer,
    topRated: topRatedReducer,
    addOnes: addOnesReducer,
    ui: uiReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export default store