"use client";

import { createSlice } from "@reduxjs/toolkit";
import { signupUser, loginUser, logoutUser, fetchManagers } from "./user-action";
import { UserState } from "./user-type";

const initialState: UserState = {
  user: null,
  managers: [],
  loading: false,
  error: null,
  status: "pending",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserError: (state) => {
      state.error = null;
      state.status = "pending";
    },
  },
  extraReducers: (builder) => {
    builder
      .addAsyncThunk(signupUser, {
        pending: (state) => {
          state.loading = true;
          state.status = "pending";
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.user = action.payload.data.user;
          state.error = null;
          state.status = "succeed";
        },
        rejected: (state, action) => {
          state.loading = false;
          state.status = "rejected";
          state.user = null;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(loginUser, {
        pending: (state) => {
          state.loading = true;
          state.status = "pending";
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.user = action.payload.data.user;
          state.status = "succeed";
          state.error = null;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.status = "rejected";
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(logoutUser, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state) => {
          state.user = null;
          state.loading = false;
          state.error = null;
          state.status = "pending";
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchManagers, {
        fulfilled: (state, action) => {
          state.managers = action.payload?.data || [];
        },
      });
  },
});

export const { resetUserError } = userSlice.actions;
export default userSlice.reducer;
