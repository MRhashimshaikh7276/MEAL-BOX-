import { createSlice } from '@reduxjs/toolkit'

// Always return 'light' on the server (initial render) to prevent hydration mismatch
// The actual theme will be applied client-side after hydration
const getTheme = () => {
  // On server, always return 'light' to match SSR
  if (typeof window === 'undefined') {
    return 'light'
  }
  // On client, check localStorage but default to 'light' if not set
  return localStorage.getItem('theme') || 'light'
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'light', mobileMenuOpen: false }, // Always start with 'light' to prevent hydration mismatch
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme)
      }
    },
    setTheme: (state, action) => { state.theme = action.payload },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen },
    initializeTheme: (state) => {
      // Call this after hydration to sync with localStorage
      if (typeof window !== 'undefined') {
        state.theme = localStorage.getItem('theme') || 'light'
      }
    },
  }
})
export const { toggleTheme, setTheme, toggleMobileMenu, initializeTheme } = uiSlice.actions
export default uiSlice.reducer
