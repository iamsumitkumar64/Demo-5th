"use client";

import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Alert, CircularProgress } from "@mui/material";
import { ActionDialogProps } from "./action-dialog.interface";
import styles from "./action-dialog.module.css";

export default function ActionDialog({
  open,
  title,
  description,
  warning,
  hasCommentField = false,
  isCommentRequired = false,
  commentLabel = "Comment",
  confirmButtonText = "Confirm",
  confirmButtonColor = "primary",
  isLoading = false,
  details = [],
  onConfirm,
  onClose,
}: ActionDialogProps) {
  const [comment, setComment] = useState("");

  const isConfirmDisabled =
    isLoading || (isCommentRequired && comment.trim().length === 0);

  const handleConfirm = () => {
    onConfirm(comment.trim());
    setComment("");
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className={styles.content}>
        {description && (
          <Typography variant="body2">{description}</Typography>
        )}

        {(details || []).length > 0 && (
          <Box className={styles.detailsList}>
            {(details || []).map((d) => (
              <Box key={d.label} className={styles.detailRow}>
                <Typography className={styles.detailLabel}>{d.label}:</Typography>
                <Typography className={styles.detailValue}>{d.value}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {warning && <Alert severity="warning">{warning}</Alert>}

        {hasCommentField && (
          <TextField
            label={commentLabel}
            multiline
            rows={3}
            fullWidth
            size="small"
            required={isCommentRequired}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isCommentRequired ? "Comment is required" : "Optional comment"}
          />
        )}
      </DialogContent>
      <DialogActions className={styles.dialogActions}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={isLoading}
          className={styles.actionBtn}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmButtonColor}
          disabled={isConfirmDisabled}
          className={styles.actionBtn}
        >
          {isLoading ? <CircularProgress size={20} color="inherit" /> : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
