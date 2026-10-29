import { ClaimCategoryEnum } from "../enum/claim-category/claim-category.enum";

export interface CreateClaimDto {
  title: string;
  category: ClaimCategoryEnum;
  amount: number;
  expense_date: string;
  description: string;
  receipt_url?: string;
  owner_uuid: string;
  owner_name: string;
  owner_role: string;
  reviewer_uuid?: string;
  reviewer_name?: string;
  reviewer_type?: "MANAGER" | "FINANCE";
}
