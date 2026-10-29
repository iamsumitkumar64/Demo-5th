import { ClaimEntity, ClaimHistoryEntity } from "@/firebase/domain/claim/claim.entity";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";

export type Claim = ClaimEntity;
export type ClaimHistoryEntry = ClaimHistoryEntity;

export interface ClaimState {
  claims: ClaimEntity[];
  currentClaim: ClaimEntity | null;
  pendingClaims: ClaimEntity[];
  reviewedClaims: ClaimEntity[];
  financeFirstReviewClaims: ClaimEntity[];
  financeNeedsApprovalClaims: ClaimEntity[];
  financeReadyForPaymentClaims: ClaimEntity[];
  financePaidClaims: ClaimEntity[];
  loading: boolean;
  error: string | null;
  status: "pending" | "succeed" | "rejected";
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pendingPage: number;
  pendingTotal: number;
  pendingTotalPages: number;
  reviewedPage: number;
  reviewedTotal: number;
  reviewedTotalPages: number;
  financeFirstReviewTotal: number;
  financeFirstReviewTotalPages: number;
  financeNeedsApprovalTotal: number;
  financeNeedsApprovalTotalPages: number;
  financeReadyForPaymentTotal: number;
  financeReadyForPaymentTotalPages: number;
  financeReadyForPaymentSum: number;
  financePaidTotal: number;
  financePaidTotalPages: number;
  financePaidSum: number;
}
