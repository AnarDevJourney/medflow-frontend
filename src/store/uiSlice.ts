import { createSlice } from "@reduxjs/toolkit";

// UI-only state. Server data lives in React Query, never here — the sidebar
// configuration (collapsed, order, favorites) is server data per user.
// TODO(F1): notification badge.
type UiState = Record<string, never>;

const initialState: UiState = {};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {},
});

export default uiSlice.reducer;
