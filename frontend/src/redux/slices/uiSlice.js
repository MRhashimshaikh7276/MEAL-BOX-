import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: localStorage.getItem('theme') || 'light', mobileMenuOpen: false },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    setTheme: (state, action) => { state.theme = action.payload },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
  }
})
export const { toggleTheme, setTheme, toggleMobileMenu } = uiSlice.actions
export default uiSlice.reducer
