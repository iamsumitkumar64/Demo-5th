"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchClaimById, reviewClaim } from "@/redux/feature/claim/claim-action";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Button, Typography, CircularProgress, Alert, Card, CardContent, Divider, Link as MuiLink } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./manager-claim-view.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

const DIALOG_DATA = {
  approve: {
    title: "Approve Claim",
    description: "Approve this claim to move it forward?",
    confirmButtonText: "Approve",
    isCommentRequired: false,
    commentLabel: "Optional Comment",
  },
  changes: {
    title: "Request Changes",
    description: "Provide revision feedback to the employee.",
    confirmButtonText: "Request Changes",
    isCommentRequired: true,
    commentLabel: "Revision Notes (Required)",
  },
  reject: {
    title: "Reject Claim",
    warning: "Rejection is final. The claim cannot be resubmitted.",
    confirmButtonText: "Reject Claim",
    isCommentRequired: true,
    commentLabel: "Rejection Reason (Required)",
  },
};

export default function ManagerClaimReviewPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { uuid } = use(params);

  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const { currentClaim, loading, error } = useAppSelector((state: RootState) => state.claimReducer);

  const [dialogAction, setDialogAction] = useState<"approve" | "changes" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (uuid) dispatch(fetchClaimById(uuid));
  }, [dispatch, uuid]);

  if (loading && !currentClaim) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}><CircularProgress /></Box>
      </Box>
    );
  }

  if (error || !currentClaim) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}>
          <Alert severity="error">This claim no longer exists</Alert>
          <Box><MuiLink component={Link} href="/manager/claims">Return to Review Queue</MuiLink></Box>
        </Box>
      </Box>
    );
  }

  const isReviewer = currentClaim.reviewer_uuid === user?.uuid;
  const isUnauthorized =
    user &&
    ((!isReviewer && currentClaim.owner_uuid !== user.uuid) ||
      (currentClaim.status === ClaimStatusEnum.DRAFT && currentClaim.owner_uuid !== user.uuid));

  if (isUnauthorized) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}>
          <Alert severity="error">Not authorised to view this claim</Alert>
          <Box>
            <MuiLink component={Link} href={`/${user?.role.toLowerCase()}/claims`}>
              Return to home
            </MuiLink>
          </Box>
        </Box>
      </Box>
    );
  }

  const handleConfirm = async (comment?: string) => {
    if (!dialogAction || !user) return;
    setIsProcessing(true);
    const actor = { uuid: user.uuid, name: user.username, role: user.role };
    try {
      const actionName =
        dialogAction === "approve"
          ? "Approve"
          : dialogAction === "changes"
          ? "Request changes"
          : "Reject";
      await dispatch(reviewClaim({ uuid, action: actionName, comment, actor })).unwrap();
      const message =
        actionName === "Request changes"
          ? "Changes requested"
          : `Claim ${actionName.toLowerCase()}d`;
      enqueueSnackbar(message, { variant: "info" });
      router.push("/manager/claims");
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Action failed", { variant: "error" });
    } finally {
      setIsProcessing(false);
      setDialogAction(null);
    }
  };

  const latestReject = (currentClaim.history || [])
    .slice()
    .reverse()
    .find((h) => h.action === "Reject" || h.action === "Rejected");
  const claimFields = [
    { label: "Employee", value: currentClaim.owner_name },
    { label: "Category", value: currentClaim.category },
    { label: "Amount", value: `₹ ${currentClaim.amount.toLocaleString("en-IN")}` },
    { label: "Expense date", value: currentClaim.expense_date },
    { label: "Description", value: currentClaim.description },
    ...(currentClaim.status === ClaimStatusEnum.PAID
      ? [
          { label: "Payment reference", value: currentClaim.payment_reference || "N/A" },
          {
            label: "Paid date",
            value: currentClaim.paid_date ? new Date(currentClaim.paid_date).toLocaleDateString() : "-",
          },
        ]
      : []),
  ];

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Box className={styles.topRow}>
          <Typography variant="h5"><strong>{currentClaim.title}</strong></Typography>
          <StatusBadge status={currentClaim.status} />
        </Box>

        {currentClaim.status === ClaimStatusEnum.REJECTED && (
          <Alert severity="error">
            <Typography variant="body2">
              <strong>Rejection reason:</strong> {currentClaim.rejection_reason || "None specified"}
            </Typography>
            {latestReject && (
              <Typography variant="caption">
                Rejected by: <strong>{latestReject.actor_name}</strong> ({latestReject.actor_role})
              </Typography>
            )}
          </Alert>
        )}

        {currentClaim.status === ClaimStatusEnum.PAID && (
          <Alert severity="success">
            <Typography variant="body2">
              Payment reference: <strong>{currentClaim.payment_reference || "N/A"}</strong> | Paid on:{" "}
              <strong>{currentClaim.paid_date ? new Date(currentClaim.paid_date).toLocaleDateString() : "-"}</strong>
            </Typography>
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            {(claimFields || []).map((f) => (
              <Box key={f.label} className={styles.fieldRow}>
                <Typography><strong>{f.label}:</strong></Typography>
                <Typography>{f.value}</Typography>
              </Box>
            ))}

            <Box className={styles.fieldRow}>
              <Typography><strong>Receipt:</strong></Typography>
              {currentClaim.receipt_url ? (
                <MuiLink href={currentClaim.receipt_url} target="_blank" rel="noopener noreferrer">
                  View receipt link
                </MuiLink>
              ) : (
                <Typography>None</Typography>
              )}
            </Box>

            {currentClaim.status === ClaimStatusEnum.SUBMITTED && (
              <Box className={styles.actionsBar}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  className={styles.btn}
                  onClick={() => setDialogAction("approve")}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  className={styles.btn}
                  onClick={() => setDialogAction("changes")}
                >
                  Request changes
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  className={styles.btn}
                  onClick={() => setDialogAction("reject")}
                >
                  Reject
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6"><strong>Activity Timeline</strong></Typography>
            {(currentClaim.history || []).map((h, idx) => (
              <Box key={idx}>
                {idx > 0 && <Divider className={styles.historyDivider} />}
                <Box className={styles.historyItem}>
                  <Typography><strong>{h.action}</strong> - by {h.actor_name} ({h.actor_role})</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(h.created_at).toLocaleString()}
                  </Typography>
                  {h.comment && (
                    <Typography variant="body2" className={styles.commentLine}>
                      Comment: &ldquo;{h.comment}&rdquo;
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {dialogAction && (
        <ActionDialog
          open={Boolean(dialogAction)}
          hasCommentField
          isLoading={isProcessing}
          onConfirm={handleConfirm}
          onClose={() => setDialogAction(null)}
          {...DIALOG_DATA[dialogAction]}
        />
      )}
    </Box>
  );
}
