import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { bannerSectionAPI } from "../../services/api.js"

export const fetchBanners = createAsyncThunk(
  "banners/fetch",
  async () => {
    const res = await bannerSectionAPI.getAll()
    return res.data.bannerSections
  }
)

const bannerSlice = createSlice({
  name: "banners",
  initialState: {
    list: [],
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchBanners.rejected, (state) => {
        state.loading = false
      })
  },
})

export default bannerSlice.reducer