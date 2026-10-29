"use client";

import { createAsyncThunk } from "@reduxjs/toolkit";
import { SignupSchemaType } from "@/schemas/signup";
import { LoginSchemaType } from "@/schemas/login";
import { userService } from "@/firebase/services/user/user.service";
import Cookies from "js-cookie";

export const signupUser = createAsyncThunk(
  "user/signup",
  async (
    data: SignupSchemaType & { manager_name?: string },
    { rejectWithValue }
  ) => {
    try {
      const user = await userService.registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        role: data.role,
        manager_uuid: data.manager_uuid,
        manager_name: data.manager_name,
      });

      Cookies.set("access_token", user.uuid, { expires: 7 });
      Cookies.set("role", user.role, { expires: 7 });

      return { message: "Account created successfully", data: { user } };
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (data: LoginSchemaType, { rejectWithValue }) => {
    try {
      const user = await userService.loginUser({
        email: data.email,
        password: data.password,
      });

      Cookies.set("access_token", user.uuid, { expires: 7 });
      Cookies.set("role", user.role, { expires: 7 });

      return { message: "Logged in successfully", data: { user } };
    } catch (error: any) {
      return rejectWithValue(error.message || "Incorrect email or password");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      await userService.logoutUser();
      Cookies.remove("access_token");
      Cookies.remove("role");
      const { persistor } = await import("@/redux/store");
      await persistor.purge();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to logout");
    }
  }
);

export const fetchManagers = createAsyncThunk(
  "user/fetchManagers",
  async (_, { rejectWithValue }) => {
    try {
      const managers = await userService.getManagers();
      return { message: "Managers fetched", data: managers };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch managers");
    }
  }
);
