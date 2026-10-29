import { ClaimCategoryEnum } from "../enum/claim-category/claim-category.enum";
import { ClaimStatusEnum } from "../enum/claim-status/claim-status.enum";

export interface QueryClaimDto {
  page?: number;
  limit?: number;
  owner_uuid?: string;
  reviewer_uuid?: string;
  reviewer_type?: "MANAGER" | "FINANCE";
  category?: ClaimCategoryEnum | "ALL";
  status?: ClaimStatusEnum | "ALL";
  sort_by?: string;
  employee_name?: string;
  month?: string;
}