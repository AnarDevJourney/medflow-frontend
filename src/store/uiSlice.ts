import { createSlice } from "@reduxjs/toolkit";

// UI-only state. Server data lives in React Query, never here.
interface UiState {
  sidebarCollapsed: boolean;
}

const initialState: UiState = { sidebarCollapsed: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
