"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchClaimById, deleteDraftClaim, withdrawClaim, submitExistingDraft } from "@/redux/feature/claim/claim-action";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Button, Typography, CircularProgress, Alert, Card, CardContent, Divider, Link as MuiLink } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./claim-view.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

const DIALOG_DATA = {
  delete: {
    title: "Delete Draft",
    description: "Are you sure you want to delete this draft claim?",
    confirmButtonText: "Delete",
  },
  withdraw: {
    title: "Withdraw Claim",
    description: "Withdraw this submitted claim back to Draft?",
    confirmButtonText: "Withdraw",
  },
  submit: {
    title: "Confirm Submission",
    description: "Submit this draft claim for review?",
    confirmButtonText: "Submit Claim",
  },
};

export default function EmployeeClaimDetailPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { uuid } = use(params);

  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const { currentClaim, loading, error } = useAppSelector((state: RootState) => state.claimReducer);

  const [dialogAction, setDialogAction] = useState<"delete" | "withdraw" | "submit" | null>(null);
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
          <Box><MuiLink component={Link} href="/employee/claims">Return to My Claims</MuiLink></Box>
        </Box>
      </Box>
    );
  }

  if (user && currentClaim.owner_uuid !== user.uuid) {
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

  const latestChange = (currentClaim.history || [])
    .slice()
    .reverse()
    .find((h) => h.action === "Changes requested");
  const latestReject = (currentClaim.history || [])
    .slice()
    .reverse()
    .find((h) => h.action === "Reject" || h.action === "Rejected");

  const currentlyWith =
    currentClaim.status === ClaimStatusEnum.SUBMITTED
      ? currentClaim.reviewer_type === "FINANCE" || currentClaim.owner_role === "Manager"
        ? "Finance team"
        : currentClaim.reviewer_name || "Manager"
      : currentClaim.status === ClaimStatusEnum.CHANGES_REQUESTED
        ? "You"
        : currentClaim.status === ClaimStatusEnum.MANAGER_APPROVED ||
          currentClaim.status === ClaimStatusEnum.FINANCE_APPROVED
          ? "Finance team"
          : null;

  const handleConfirm = async () => {
    if (!dialogAction || !user) return;
    setIsProcessing(true);
    const actor = { uuid: user.uuid, name: user.username, role: user.role };
    try {
      if (dialogAction === "delete") {
        await dispatch(deleteDraftClaim(uuid)).unwrap();
        enqueueSnackbar("Draft deleted", { variant: "info" });
        router.push("/employee/claims");
        return;
      }
      if (dialogAction === "withdraw") {
        await dispatch(withdrawClaim({ uuid, actor })).unwrap();
        enqueueSnackbar("Claim withdrawn", { variant: "info" });
      } else {
        await dispatch(submitExistingDraft({ uuid, actor })).unwrap();
        enqueueSnackbar("Claim submitted", { variant: "info" });
      }
      dispatch(fetchClaimById(uuid));
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Action failed", { variant: "error" });
    } finally {
      setIsProcessing(false);
      setDialogAction(null);
    }
  };

  const claimFields = [
    { label: "Category", value: currentClaim.category },
    { label: "Amount", value: `₹ ${currentClaim.amount.toLocaleString("en-IN")}` },
    { label: "Expense date", value: currentClaim.expense_date },
    { label: "Description", value: currentClaim.description },
    ...(currentlyWith ? [{ label: "Currently with", value: currentlyWith }] : []),
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

        {currentClaim.status === ClaimStatusEnum.CHANGES_REQUESTED && latestChange && (
          <Alert
            severity="warning"
            action={
              <Button
                variant="contained"
                size="small"
                className={styles.btn}
                onClick={() => router.push(`/employee/claims/${uuid}/edit`)}
              >
                Edit
              </Button>
            }
          >
            <strong>Reviewer requested changes:</strong> {latestChange.comment}
          </Alert>
        )}

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

            <Box className={styles.actionsBar}>
              {currentClaim.status === ClaimStatusEnum.DRAFT && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    className={styles.btn}
                    onClick={() => router.push(`/employee/claims/${uuid}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    className={styles.btn}
                    onClick={() => setDialogAction("submit")}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    className={styles.btn}
                    onClick={() => setDialogAction("delete")}
                  >
                    Delete
                  </Button>
                </>
              )}
              {currentClaim.status === ClaimStatusEnum.SUBMITTED && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  className={styles.btn}
                  onClick={() => setDialogAction("withdraw")}
                >
                  Withdraw
                </Button>
              )}
              {currentClaim.status === ClaimStatusEnum.CHANGES_REQUESTED && (
                <Button
                  variant="contained"
                  size="small"
                  className={styles.btn}
                  onClick={() => router.push(`/employee/claims/${uuid}/edit`)}
                >
                  Edit & Resubmit
                </Button>
              )}
            </Box>
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
          isLoading={isProcessing}
          onConfirm={handleConfirm}
          onClose={() => setDialogAction(null)}
          {...DIALOG_DATA[dialogAction]}
        />
      )}
    </Box>
  );
}
