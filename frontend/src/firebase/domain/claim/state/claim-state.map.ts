import { ClaimStatusEnum } from "../enum/claim-status/claim-status.enum";

export const CLAIM_STATE_TRANSITION_MAP: Record<ClaimStatusEnum, ClaimStatusEnum[]> = {
  [ClaimStatusEnum.DRAFT]: [ClaimStatusEnum.SUBMITTED],
  [ClaimStatusEnum.SUBMITTED]: [ClaimStatusEnum.DRAFT, ClaimStatusEnum.CHANGES_REQUESTED, ClaimStatusEnum.MANAGER_APPROVED, ClaimStatusEnum.REJECTED,],
  [ClaimStatusEnum.CHANGES_REQUESTED]: [ClaimStatusEnum.SUBMITTED],
  [ClaimStatusEnum.MANAGER_APPROVED]: [ClaimStatusEnum.FINANCE_APPROVED, ClaimStatusEnum.REJECTED, ClaimStatusEnum.PAID,],
  [ClaimStatusEnum.FINANCE_APPROVED]: [ClaimStatusEnum.PAID],
  [ClaimStatusEnum.REJECTED]: [],
  [ClaimStatusEnum.PAID]: [],
};

export function isValidClaimTransition(fromStatus: ClaimStatusEnum, toStatus: ClaimStatusEnum): boolean {
  return (CLAIM_STATE_TRANSITION_MAP[fromStatus] || []).includes(toStatus);
}
