import { Chip } from "@mui/material";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import { StatusBadgeProps } from "./status-badge.interface";
import styles from "./status-badge.module.css";

const STATUS_CONFIG: Record<
  ClaimStatusEnum,
  { label: string; color: "default" | "info" | "warning" | "primary" | "error" | "success" }
> = {
  [ClaimStatusEnum.DRAFT]: { label: "Draft", color: "default" },
  [ClaimStatusEnum.SUBMITTED]: { label: "Submitted", color: "info" },
  [ClaimStatusEnum.CHANGES_REQUESTED]: { label: "Changes requested", color: "warning" },
  [ClaimStatusEnum.MANAGER_APPROVED]: { label: "Manager approved", color: "primary" },
  [ClaimStatusEnum.FINANCE_APPROVED]: { label: "Finance approved", color: "primary" },
  [ClaimStatusEnum.REJECTED]: { label: "Rejected", color: "error" },
  [ClaimStatusEnum.PAID]: { label: "Paid", color: "success" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: "default" };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      className={styles.chip}
    />
  );
}
