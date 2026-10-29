export interface ActionDialogProps {
  open: boolean;
  title: string;
  description?: string;
  warning?: string;
  hasCommentField?: boolean;
  isCommentRequired?: boolean;
  commentLabel?: string;
  confirmButtonText?: string;
  confirmButtonColor?: "primary" | "error" | "success" | "warning";
  isLoading?: boolean;
  details?: { label: string; value: string }[];
  onConfirm: (comment?: string) => void;
  onClose: () => void;
}
