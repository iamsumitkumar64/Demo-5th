import { ClaimCategoryEnum } from "../enum/claim-category/claim-category.enum";

export interface UpdateClaimDto {
  title?: string;
  category?: ClaimCategoryEnum;
  amount?: number;
  expense_date?: string;
  description?: string;
  receipt_url?: string;
}
