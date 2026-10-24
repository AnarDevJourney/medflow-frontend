import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// UI-only state. Server data lives in React Query, never here (the sidebar
// configuration and appearance are server data per user).
interface UiState {
  // A request got 503 / no answer → the retry banner; cleared by the next success
  serviceUnavailable: boolean;
  // Unread notifications — pushed by the server over Socket.io (null = not known yet)
  unreadCount: number | null;
}

const initialState: UiState = { serviceUnavailable: false, unreadCount: null };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setServiceUnavailable(state, action: PayloadAction<boolean>) {
      state.serviceUnavailable = action.payload;
    },
    setUnreadCount(state, action: PayloadAction<number | null>) {
      state.unreadCount = action.payload;
    },
  },
});

export const { setServiceUnavailable, setUnreadCount } = uiSlice.actions;
export default uiSlice.reducer;
