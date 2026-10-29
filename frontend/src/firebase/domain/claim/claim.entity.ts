import { ClaimCategoryEnum } from "./enum/claim-category/claim-category.enum";
import { ClaimStatusEnum } from "./enum/claim-status/claim-status.enum";
import { ClaimHistoryEntity } from "./claim-history.entity";

export const CLAIM_FIRESTORE_COLLECTION = "claims";

export interface ClaimEntity {
  uuid: string;
  title: string;
  category: ClaimCategoryEnum;
  amount: number;
  expense_date: string;
  description: string;
  receipt_url?: string;
  status: ClaimStatusEnum;
  owner_uuid: string;
  owner_name: string;
  owner_role: string;
  reviewer_uuid?: string;
  reviewer_name?: string;
  reviewer_type?: "MANAGER" | "FINANCE";
  rejection_reason?: string;
  payment_reference?: string;
  paid_date?: string;
  submitted_at?: string;
  history: ClaimHistoryEntity[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type { ClaimHistoryEntity };
