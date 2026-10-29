"use client";

import { createAsyncThunk } from "@reduxjs/toolkit";
import { claimService } from "@/firebase/services/claim/claim.service";
import { ClaimEntity, ClaimHistoryEntity } from "@/firebase/domain/claim/claim.entity";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import { isValidClaimTransition } from "@/firebase/domain/claim/state/claim-state.map";
import { QueryClaimDto } from "@/firebase/domain/claim/dto/query-claim.dto";

interface ActionActor {
  uuid: string;
  name: string;
  role: string;
}

const createHistoryEntry = (
  action: string,
  actor: ActionActor,
  comment?: string
): ClaimHistoryEntity => {
  const entry: ClaimHistoryEntity = {
    uuid: "hist_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    action,
    actor_uuid: actor.uuid,
    actor_name: actor.name,
    actor_role: actor.role,
    created_at: new Date().toISOString(),
  };
  if (comment) entry.comment = comment;
  return entry;
};

export const fetchUserClaims = createAsyncThunk(
  "claim/fetchUserClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getUserClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Claims fetched successfully", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch claims");
    }
  }
);

export const fetchPendingReviewClaims = createAsyncThunk(
  "claim/fetchPendingReviewClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getManagerPendingClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Pending claims fetched successfully", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch pending claims");
    }
  }
);

export const fetchReviewedClaims = createAsyncThunk(
  "claim/fetchReviewedClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getManagerReviewedClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Reviewed claims fetched successfully", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch reviewed claims");
    }
  }
);

export const fetchFinanceFirstReviewClaims = createAsyncThunk(
  "claim/fetchFinanceFirstReviewClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getFinanceFirstReviewClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "First review claims fetched", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch first review claims");
    }
  }
);

export const fetchFinanceNeedsApprovalClaims = createAsyncThunk(
  "claim/fetchFinanceNeedsApprovalClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getFinanceNeedsApprovalClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Needs approval claims fetched", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch claims");
    }
  }
);

export const fetchFinanceReadyForPaymentClaims = createAsyncThunk(
  "claim/fetchFinanceReadyForPaymentClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getFinanceReadyForPaymentClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Ready for payment claims fetched", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch claims");
    }
  }
);

export const fetchFinancePaidClaims = createAsyncThunk(
  "claim/fetchFinancePaidClaims",
  async (queryDto: QueryClaimDto, { rejectWithValue }) => {
    try {
      const res = await claimService.getFinancePaidClaims({
        ...queryDto,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
      });
      return { message: "Paid claims fetched", ...res };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch paid claims");
    }
  }
);

export const fetchClaimById = createAsyncThunk(
  "claim/fetchClaimById",
  async (uuid: string, { rejectWithValue }) => {
    try {
      const claim = await claimService.getClaimById(uuid);
      if (!claim) throw new Error("This claim no longer exists");
      return { message: "Claim fetched", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Claim not found");
    }
  }
);

export const createDraftClaim = createAsyncThunk(
  "claim/createDraft",
  async (
    payload: Omit<ClaimEntity, "uuid" | "created_at" | "updated_at" | "history" | "status"> & {
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const historyEntry = createHistoryEntry("Draft saved", payload.actor);
      const { actor, ...claimData } = payload;
      const claim = await claimService.createClaim({
        ...claimData,
        status: ClaimStatusEnum.DRAFT,
        history: [historyEntry],
      });
      return { message: "Draft saved", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save draft");
    }
  }
);

export const submitNewClaim = createAsyncThunk(
  "claim/submitNew",
  async (
    payload: Omit<ClaimEntity, "uuid" | "created_at" | "updated_at" | "history" | "status"> & {
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const now = new Date().toISOString();
      const historyEntry = createHistoryEntry("Claim submitted", payload.actor);
      const { actor, ...claimData } = payload;
      const claim = await claimService.createClaim({
        ...claimData,
        status: ClaimStatusEnum.SUBMITTED,
        submitted_at: now,
        history: [historyEntry],
      });
      return { message: "Claim submitted", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit claim");
    }
  }
);

export const submitExistingDraft = createAsyncThunk(
  "claim/submitExistingDraft",
  async (
    payload: {
      uuid: string;
      updates?: Partial<ClaimEntity>;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.SUBMITTED)) {
        throw new Error("This action is not allowed for the claim status");
      }

      const now = new Date().toISOString();
      const historyEntry = createHistoryEntry("Claim submitted", payload.actor);
      const claim = await claimService.updateClaim(payload.uuid, {
        ...(payload.updates || {}),
        status: ClaimStatusEnum.SUBMITTED,
        submitted_at: now,
        history: [...(existing.history || []), historyEntry],
      });
      return { message: "Claim submitted", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit claim");
    }
  }
);

export const withdrawClaim = createAsyncThunk(
  "claim/withdraw",
  async (
    payload: {
      uuid: string;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.DRAFT)) {
        throw new Error("This claim has already been reviewed");
      }

      const historyEntry = createHistoryEntry("Withdrawn", payload.actor);
      const claim = await claimService.updateClaim(payload.uuid, {
        status: ClaimStatusEnum.DRAFT,
        history: [...(existing.history || []), historyEntry],
      });
      return { message: "Claim withdrawn", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to withdraw claim");
    }
  }
);

export const deleteDraftClaim = createAsyncThunk(
  "claim/deleteDraft",
  async (uuid: string, { rejectWithValue }) => {
    try {
      const existing = await claimService.getClaimById(uuid);
      if (!existing) throw new Error("This claim no longer exists");
      if (existing.status !== ClaimStatusEnum.DRAFT) {
        throw new Error("Only draft claims can be deleted");
      }

      await claimService.deleteClaim(uuid);
      return { message: "Draft deleted", uuid };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete claim");
    }
  }
);

export const saveChangesClaim = createAsyncThunk(
  "claim/saveChanges",
  async (
    payload: {
      uuid: string;
      updates: Partial<ClaimEntity>;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      const historyEntry = createHistoryEntry("Edits saved", payload.actor);
      const claim = await claimService.updateClaim(payload.uuid, {
        ...payload.updates,
        status: ClaimStatusEnum.CHANGES_REQUESTED,
        history: [...(existing.history || []), historyEntry],
      });
      return { message: "Changes saved", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save changes");
    }
  }
);

export const resubmitClaim = createAsyncThunk(
  "claim/resubmit",
  async (
    payload: {
      uuid: string;
      updates: Partial<ClaimEntity>;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.SUBMITTED)) {
        throw new Error("This action is not allowed for the claim status");
      }

      const now = new Date().toISOString();
      const historyEntry = createHistoryEntry("Resubmitted", payload.actor);
      const claim = await claimService.updateClaim(payload.uuid, {
        ...payload.updates,
        status: ClaimStatusEnum.SUBMITTED,
        submitted_at: now,
        history: [...(existing.history || []), historyEntry],
      });
      return { message: "Claim resubmitted", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to resubmit claim");
    }
  }
);

export const reviewClaim = createAsyncThunk(
  "claim/review",
  async (
    payload: {
      uuid: string;
      action: "Approve" | "Request changes" | "Reject";
      comment?: string;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      let newStatus = ClaimStatusEnum.MANAGER_APPROVED;
      let actionLabel = "Approved";

      if (payload.action === "Request changes") {
        newStatus = ClaimStatusEnum.CHANGES_REQUESTED;
        actionLabel = "Changes requested";
      } else if (payload.action === "Reject") {
        newStatus = ClaimStatusEnum.REJECTED;
        actionLabel = "Rejected";
      }

      if (!isValidClaimTransition(existing.status, newStatus)) {
        throw new Error("This claim has already been updated");
      }

      const historyEntry = createHistoryEntry(actionLabel, payload.actor, payload.comment);
      const claim = await claimService.updateClaim(payload.uuid, {
        status: newStatus,
        rejection_reason: payload.action === "Reject" ? payload.comment : existing.rejection_reason,
        history: [...(existing.history || []), historyEntry],
      });

      return {
        message:
          payload.action === "Approve"
            ? "Claim approved"
            : payload.action === "Request changes"
            ? "Changes requested"
            : "Claim rejected",
        data: claim,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Review action failed");
    }
  }
);

export const financeApproveClaim = createAsyncThunk(
  "claim/financeApprove",
  async (
    payload: {
      uuid: string;
      actor: ActionActor;
      comment?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.FINANCE_APPROVED)) {
        throw new Error("This action is not allowed for the claim status");
      }

      const historyEntry = createHistoryEntry("Finance approved", payload.actor, payload.comment);
      const claim = await claimService.updateClaim(payload.uuid, {
        status: ClaimStatusEnum.FINANCE_APPROVED,
        history: [...(existing.history || []), historyEntry],
      });

      return { message: "Claim approved by Finance", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Finance approval failed");
    }
  }
);

export const financeRejectClaim = createAsyncThunk(
  "claim/financeReject",
  async (
    payload: {
      uuid: string;
      rejection_reason: string;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.REJECTED)) {
        throw new Error("This action is not allowed for the claim status");
      }

      const historyEntry = createHistoryEntry("Finance rejected", payload.actor, payload.rejection_reason);
      const claim = await claimService.updateClaim(payload.uuid, {
        status: ClaimStatusEnum.REJECTED,
        rejection_reason: payload.rejection_reason,
        history: [...(existing.history || []), historyEntry],
      });

      return { message: "Claim rejected by Finance", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Finance rejection failed");
    }
  }
);

export const markClaimPaid = createAsyncThunk(
  "claim/markPaid",
  async (
    payload: {
      uuid: string;
      payment_reference: string;
      actor: ActionActor;
    },
    { rejectWithValue }
  ) => {
    try {
      const existing = await claimService.getClaimById(payload.uuid);
      if (!existing) throw new Error("This claim no longer exists");

      if (!isValidClaimTransition(existing.status, ClaimStatusEnum.PAID)) {
        throw new Error("This action is not allowed for the claim status");
      }

      const now = new Date().toISOString();
      const historyEntry = createHistoryEntry(
        `Payment recorded: ${payload.payment_reference}`,
        payload.actor
      );

      const claim = await claimService.updateClaim(payload.uuid, {
        status: ClaimStatusEnum.PAID,
        payment_reference: payload.payment_reference,
        paid_date: now,
        history: [...(existing.history || []), historyEntry],
      });

      return { message: "Payment recorded", data: claim };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark claim paid");
    }
  }
);
