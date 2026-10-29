"use client";

import { createSlice } from "@reduxjs/toolkit";
import { ClaimState } from "./claim-type";
import { fetchUserClaims, fetchPendingReviewClaims, fetchReviewedClaims, fetchFinanceFirstReviewClaims, fetchFinanceNeedsApprovalClaims, fetchFinanceReadyForPaymentClaims, fetchFinancePaidClaims, fetchClaimById, createDraftClaim, submitNewClaim, submitExistingDraft, withdrawClaim, deleteDraftClaim, saveChangesClaim, resubmitClaim, reviewClaim, financeApproveClaim, financeRejectClaim, markClaimPaid } from "./claim-action";

const initialState: ClaimState = {
  claims: [],
  currentClaim: null,
  pendingClaims: [],
  reviewedClaims: [],
  financeFirstReviewClaims: [],
  financeNeedsApprovalClaims: [],
  financeReadyForPaymentClaims: [],
  financePaidClaims: [],
  loading: false,
  error: null,
  status: "pending",
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  pendingPage: 1,
  pendingTotal: 0,
  pendingTotalPages: 1,
  reviewedPage: 1,
  reviewedTotal: 0,
  reviewedTotalPages: 1,
  financeFirstReviewTotal: 0,
  financeFirstReviewTotalPages: 1,
  financeNeedsApprovalTotal: 0,
  financeNeedsApprovalTotalPages: 1,
  financeReadyForPaymentTotal: 0,
  financeReadyForPaymentTotalPages: 1,
  financeReadyForPaymentSum: 0,
  financePaidTotal: 0,
  financePaidTotalPages: 1,
  financePaidSum: 0,
};

const claimSlice = createSlice({
  name: "claim",
  initialState,
  reducers: {
    clearCurrentClaim: (state) => {
      state.currentClaim = null;
      state.error = null;
    },
    resetClaimError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addAsyncThunk(fetchUserClaims, {
        pending: (state) => {
          state.loading = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.claims = action.payload?.data || [];
          state.total = action.payload?.total || 0;
          state.page = action.payload?.page || 1;
          state.limit = action.payload?.limit || 10;
          state.totalPages = action.payload?.totalPages || 1;
          state.error = null;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchPendingReviewClaims, {
        pending: (state) => {
          state.loading = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.pendingClaims = action.payload?.data || [];
          state.pendingTotal = action.payload?.total || 0;
          state.pendingPage = action.payload?.page || 1;
          state.pendingTotalPages = action.payload?.totalPages || 1;
          state.error = null;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchReviewedClaims, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.reviewedClaims = action.payload?.data || [];
          state.reviewedTotal = action.payload?.total || 0;
          state.reviewedPage = action.payload?.page || 1;
          state.reviewedTotalPages = action.payload?.totalPages || 1;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchFinanceFirstReviewClaims, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.financeFirstReviewClaims = action.payload?.data || [];
          state.financeFirstReviewTotal = action.payload?.total || 0;
          state.financeFirstReviewTotalPages = action.payload?.totalPages || 1;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchFinanceNeedsApprovalClaims, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.financeNeedsApprovalClaims = action.payload?.data || [];
          state.financeNeedsApprovalTotal = action.payload?.total || 0;
          state.financeNeedsApprovalTotalPages = action.payload?.totalPages || 1;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchFinanceReadyForPaymentClaims, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.financeReadyForPaymentClaims = action.payload?.data || [];
          state.financeReadyForPaymentTotal = action.payload?.total || 0;
          state.financeReadyForPaymentTotalPages = action.payload?.totalPages || 1;
          state.financeReadyForPaymentSum = action.payload?.totalSum || 0;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchFinancePaidClaims, {
        pending: (state) => {
          state.loading = true;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.financePaidClaims = action.payload?.data || [];
          state.financePaidTotal = action.payload?.total || 0;
          state.financePaidTotalPages = action.payload?.totalPages || 1;
          state.financePaidSum = action.payload?.totalSum || 0;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(fetchClaimById, {
        pending: (state) => {
          state.loading = true;
          state.error = null;
        },
        fulfilled: (state, action) => {
          state.loading = false;
          state.currentClaim = action.payload?.data || null;
          state.error = null;
        },
        rejected: (state, action) => {
          state.loading = false;
          state.currentClaim = null;
          state.error = action.payload as string;
        },
      })
      .addAsyncThunk(createDraftClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(submitNewClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(submitExistingDraft, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(withdrawClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(deleteDraftClaim, {
        fulfilled: (state, action) => {
          state.claims = (state.claims || []).filter((c) => c.uuid !== action.payload.uuid);
          state.currentClaim = null;
        },
      })
      .addAsyncThunk(saveChangesClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(resubmitClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(reviewClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(financeApproveClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(financeRejectClaim, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      })
      .addAsyncThunk(markClaimPaid, {
        fulfilled: (state, action) => {
          state.currentClaim = action.payload?.data || null;
        },
      });
  },
});

export const { clearCurrentClaim, resetClaimError } = claimSlice.actions;
export default claimSlice.reducer;
