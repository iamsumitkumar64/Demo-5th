"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchClaimById, reviewClaim, financeApproveClaim, financeRejectClaim, markClaimPaid } from "@/redux/feature/claim/claim-action";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Button, Typography, CircularProgress, Alert, Card, CardContent, Divider, Link as MuiLink } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./finance-claim-view.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

const ACTION_CONFIGS = {
  firstApprove: {
    title: "Approve Manager Claim",
    description: "Approve this manager claim to move it forward?",
    confirmButtonText: "Approve",
    isCommentRequired: false,
    commentLabel: "Optional Comment",
  },
  firstChanges: {
    title: "Request Changes",
    description: "Provide revision feedback to the manager.",
    confirmButtonText: "Request Changes",
    isCommentRequired: true,
    commentLabel: "Revision Notes (Required)",
  },
  firstReject: {
    title: "Reject Claim",
    warning: "Rejection is final. The claim will be permanently closed.",
    confirmButtonText: "Reject Claim",
    isCommentRequired: true,
    commentLabel: "Rejection Reason (Required)",
  },
  highApprove: {
    title: "Approve Claim",
    description: "Approve this high-value claim?",
    confirmButtonText: "Approve",
    isCommentRequired: false,
    commentLabel: "Optional Comment",
  },
  highReject: {
    title: "Reject Claim",
    warning: "Rejection is final. The claim will be permanently closed.",
    confirmButtonText: "Reject Claim",
    isCommentRequired: true,
    commentLabel: "Rejection Reason (Required)",
  },
  markPaid: {
    title: "Mark Claim Paid",
    description: "Record payment reference / UTR to settle this claim.",
    confirmButtonText: "Confirm Paid",
    isCommentRequired: true,
    commentLabel: "Payment Reference / UTR (Required)",
  },
};

export default function FinanceClaimReviewPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { uuid } = use(params);

  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const { currentClaim, loading, error } = useAppSelector((state: RootState) => state.claimReducer);

  const [dialogAction, setDialogAction] = useState<keyof typeof ACTION_CONFIGS | null>(null);
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
          <Box><MuiLink component={Link} href="/finance/claims">Return to Finance Queue</MuiLink></Box>
        </Box>
      </Box>
    );
  }

  const isFinanceAuthorized =
    (currentClaim.owner_role === "Manager" && currentClaim.status !== ClaimStatusEnum.DRAFT) ||
    currentClaim.status === ClaimStatusEnum.MANAGER_APPROVED ||
    currentClaim.status === ClaimStatusEnum.FINANCE_APPROVED ||
    currentClaim.status === ClaimStatusEnum.PAID ||
    (currentClaim.status === ClaimStatusEnum.REJECTED && currentClaim.owner_role === "Manager");

  if (user && !isFinanceAuthorized) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}>
          <Alert severity="error">Not authorised to view this claim</Alert>
          <Box><MuiLink component={Link} href={`/${user.role.toLowerCase()}/claims`}>Return to home</MuiLink></Box>
        </Box>
      </Box>
    );
  }

  const handleConfirm = async (comment?: string) => {
    if (!dialogAction || !user) return;
    setIsProcessing(true);
    const actor = { uuid: user.uuid, name: user.username, role: user.role };
    try {
      const actions: Record<string, () => Promise<any>> = {
        firstApprove: () =>
          dispatch(reviewClaim({ uuid, action: "Approve", comment, actor })).unwrap(),
        firstChanges: () =>
          dispatch(reviewClaim({ uuid, action: "Request changes", comment: comment || "", actor })).unwrap(),
        firstReject: () =>
          dispatch(reviewClaim({ uuid, action: "Reject", comment: comment || "", actor })).unwrap(),
        highApprove: () => dispatch(financeApproveClaim({ uuid, actor })).unwrap(),
        highReject: () =>
          dispatch(financeRejectClaim({ uuid, rejection_reason: comment || "", actor })).unwrap(),
        markPaid: () =>
          dispatch(markClaimPaid({ uuid, payment_reference: comment || "", actor })).unwrap(),
      };
      const msgs: Record<string, string> = {
        firstApprove: "Claim approved",
        firstChanges: "Changes requested",
        firstReject: "Claim rejected",
        highApprove: "Claim approved",
        highReject: "Claim rejected",
        markPaid: "Payment recorded",
      };
      if (actions[dialogAction]) {
        await actions[dialogAction]();
        enqueueSnackbar(msgs[dialogAction] || "Action completed", { variant: "info" });
      }
      router.push("/finance/claims");
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Action failed", { variant: "error" });
    } finally {
      setIsProcessing(false);
      setDialogAction(null);
    }
  };

  const isManagerFirstReview =
    currentClaim.status === ClaimStatusEnum.SUBMITTED &&
    (currentClaim.reviewer_type === "FINANCE" || currentClaim.owner_role === UserRoleEnum.MANAGER);
  const isHighValue =
    currentClaim.status === ClaimStatusEnum.MANAGER_APPROVED && currentClaim.amount >= 10000;
  const isReadyForPayment =
    (currentClaim.status === ClaimStatusEnum.MANAGER_APPROVED && currentClaim.amount < 10000) ||
    currentClaim.status === ClaimStatusEnum.FINANCE_APPROVED;
  const latestReject = (currentClaim.history || [])
    .slice()
    .reverse()
    .find((h) => h.action === "Reject" || h.action === "Rejected");

  const claimFields = [
    { label: "Submitted by", value: `${currentClaim.owner_name} (${currentClaim.owner_role})` },
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
            <strong>Payment Reference:</strong> {currentClaim.payment_reference || "N/A"} |{" "}
            <strong>Paid Date:</strong>{" "}
            {currentClaim.paid_date ? new Date(currentClaim.paid_date).toLocaleDateString() : "-"}
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

            {(isManagerFirstReview || isHighValue || isReadyForPayment) && (
              <Box className={styles.actionsBar}>
                {isManagerFirstReview && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      className={styles.btn}
                      onClick={() => setDialogAction("firstApprove")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      className={styles.btn}
                      onClick={() => setDialogAction("firstChanges")}
                    >
                      Request changes
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      className={styles.btn}
                      onClick={() => setDialogAction("firstReject")}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {isHighValue && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      className={styles.btn}
                      onClick={() => setDialogAction("highApprove")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      className={styles.btn}
                      onClick={() => setDialogAction("highReject")}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {isReadyForPayment && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={styles.btn}
                    onClick={() => setDialogAction("markPaid")}
                  >
                    Mark paid
                  </Button>
                )}
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
          {...ACTION_CONFIGS[dialogAction]}
        />
      )}
    </Box>
  );
}
