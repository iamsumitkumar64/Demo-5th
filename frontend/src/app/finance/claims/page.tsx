"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchFinanceFirstReviewClaims, fetchFinanceNeedsApprovalClaims, fetchFinanceReadyForPaymentClaims, fetchFinancePaidClaims, reviewClaim, financeApproveClaim, financeRejectClaim, markClaimPaid } from "@/redux/feature/claim/claim-action";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Typography, Tabs, Tab, Badge, Button, TextField, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./finance-claims.module.css";
import { ClaimEntity } from "@/firebase/domain/claim/claim.entity";

const DIALOG_CONFIG = {
  firstReviewApprove: {
    title: "Approve Manager Claim",
    description: "Approve this manager claim to move it forward to Finance processing?",
    hasCommentField: true,
    commentLabel: "Optional Comment",
    confirmButtonText: "Approve",
  },
  firstReviewChanges: {
    title: "Request Changes",
    description: "Provide feedback to the manager on what needs to be revised.",
    hasCommentField: true,
    isCommentRequired: true,
    commentLabel: "Revision Notes",
    confirmButtonText: "Request Changes",
  },
  firstReviewReject: {
    title: "Reject Claim",
    warning: "Rejection is final. The claim will be permanently closed.",
    hasCommentField: true,
    isCommentRequired: true,
    commentLabel: "Rejection Reason",
    confirmButtonText: "Reject Claim",
  },
  approve: {
    title: "Approve Claim",
    description: "Approve this claim for payment payout?",
    confirmButtonText: "Approve",
  },
  reject: {
    title: "Reject Claim",
    warning: "Rejection is final. The employee cannot resubmit this claim.",
    hasCommentField: true,
    isCommentRequired: true,
    commentLabel: "Rejection Reason",
    confirmButtonText: "Reject Claim",
  },
  markPaid: {
    title: "Mark Claim Paid",
    description: "Record the payment reference to mark this claim as settled.",
    hasCommentField: true,
    isCommentRequired: true,
    commentLabel: "Payment Reference / UTR Number",
    confirmButtonText: "Confirm Paid",
  },
};

export default function FinanceClaimsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const {
    financeFirstReviewClaims = [],
    financeNeedsApprovalClaims = [],
    financeReadyForPaymentClaims = [],
    financePaidClaims = [],
    financeFirstReviewTotal = 0,
    financeFirstReviewTotalPages = 1,
    financeNeedsApprovalTotal = 0,
    financeNeedsApprovalTotalPages = 1,
    financeReadyForPaymentTotal = 0,
    financeReadyForPaymentTotalPages = 1,
    financeReadyForPaymentSum = 0,
    financePaidTotal = 0,
    financePaidTotalPages = 1,
    financePaidSum = 0,
    loading,
  } = useAppSelector((state: RootState) => state.claimReducer);

  const [tab, setTab] = useState<"first-review" | "needs-approval" | "ready-for-payment" | "paid">("first-review");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogState, setDialogState] = useState<{ type: keyof typeof DIALOG_CONFIG; claim: ClaimEntity } | null>(null);

  useEffect(() => {
    const params = {
      page,
      limit: 10,
      category: categoryFilter !== "ALL" ? (categoryFilter as ClaimCategoryEnum) : undefined,
      status: statusFilter !== "ALL" ? (statusFilter as ClaimStatusEnum) : undefined,
      sort_by: sortBy,
    };
    if (tab === "first-review") dispatch(fetchFinanceFirstReviewClaims(params));
    else if (tab === "needs-approval") dispatch(fetchFinanceNeedsApprovalClaims(params));
    else if (tab === "ready-for-payment") dispatch(fetchFinanceReadyForPaymentClaims(params));
    else if (tab === "paid") dispatch(fetchFinancePaidClaims({ ...params, month: monthFilter }));
  }, [dispatch, tab, page, categoryFilter, statusFilter, sortBy, monthFilter]);

  const handleConfirmAction = async (comment?: string) => {
    if (!dialogState || !user) return;
    const { type, claim } = dialogState;
    setIsProcessing(true);
    const actor = { uuid: user.uuid, name: user.username, role: user.role };
    try {
      const actions: Record<string, () => Promise<any>> = {
        firstReviewApprove: () =>
          dispatch(reviewClaim({ uuid: claim.uuid, action: "Approve", comment, actor })).unwrap(),
        firstReviewChanges: () =>
          dispatch(reviewClaim({ uuid: claim.uuid, action: "Request changes", comment, actor })).unwrap(),
        firstReviewReject: () =>
          dispatch(reviewClaim({ uuid: claim.uuid, action: "Reject", comment, actor })).unwrap(),
        approve: () => dispatch(financeApproveClaim({ uuid: claim.uuid, actor })).unwrap(),
        reject: () =>
          dispatch(financeRejectClaim({ uuid: claim.uuid, rejection_reason: comment || "", actor })).unwrap(),
        markPaid: () =>
          dispatch(markClaimPaid({ uuid: claim.uuid, payment_reference: comment || "", actor })).unwrap(),
      };
      const msgs: Record<string, string> = {
        firstReviewApprove: "Claim approved",
        firstReviewChanges: "Changes requested",
        firstReviewReject: "Claim rejected",
        approve: "Claim approved",
        reject: "Claim rejected",
        markPaid: "Payment recorded",
      };
      if (actions[type]) {
        await actions[type]();
        enqueueSnackbar(msgs[type] || "Action completed", { variant: "info" });
      }
      setDialogState(null);
      dispatch(fetchFinanceFirstReviewClaims({ page: 1, limit: 10 }));
      dispatch(fetchFinanceNeedsApprovalClaims({ page: 1, limit: 10 }));
      dispatch(fetchFinanceReadyForPaymentClaims({ page: 1, limit: 10 }));
      dispatch(fetchFinancePaidClaims({ page: 1, limit: 10 }));
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(typeof error == "string" ? error : "Action failed", { variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const tabConfig = {
    "first-review": {
      claims: financeFirstReviewClaims,
      total: financeFirstReviewTotal,
      pages: financeFirstReviewTotalPages,
      empty: "No manager claims waiting for first review",
    },
    "needs-approval": {
      claims: financeNeedsApprovalClaims,
      total: financeNeedsApprovalTotal,
      pages: financeNeedsApprovalTotalPages,
      empty: "No claims waiting for finance approval",
    },
    "ready-for-payment": {
      claims: financeReadyForPaymentClaims,
      total: financeReadyForPaymentTotal,
      pages: financeReadyForPaymentTotalPages,
      empty: "No claims ready for payment",
    },
    paid: {
      claims: financePaidClaims,
      total: financePaidTotal,
      pages: financePaidTotalPages,
      empty: "No paid claims recorded yet",
    },
  }[tab];

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Box className={styles.topBar}>
          <Typography variant="h5">
            <strong>Finance Queue</strong>
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setPage(1);
            }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              value="first-review"
              label={
                financeFirstReviewTotal > 0 ? (
                  <Badge badgeContent={financeFirstReviewTotal} color="primary">
                    First review
                  </Badge>
                ) : (
                  "First review"
                )
              }
            />
            <Tab
              value="needs-approval"
              label={
                financeNeedsApprovalTotal > 0 ? (
                  <Badge badgeContent={financeNeedsApprovalTotal} color="primary">
                    Needs approval
                  </Badge>
                ) : (
                  "Needs approval"
                )
              }
            />
            <Tab
              value="ready-for-payment"
              label={
                financeReadyForPaymentTotal > 0 ? (
                  <Badge badgeContent={financeReadyForPaymentTotal} color="primary">
                    Ready for payment
                  </Badge>
                ) : (
                  "Ready for payment"
                )
              }
            />
            <Tab value="paid" label="Paid" />
          </Tabs>
        </Box>

        <Box className={styles.filterBar}>
          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <MenuItem value="ALL">All categories</MenuItem>
            <MenuItem value={ClaimCategoryEnum.TRAVEL}>Travel</MenuItem>
            <MenuItem value={ClaimCategoryEnum.FOOD}>Food</MenuItem>
            <MenuItem value={ClaimCategoryEnum.EQUIPMENT}>Equipment</MenuItem>
            <MenuItem value={ClaimCategoryEnum.OTHER}>Other</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value={ClaimStatusEnum.SUBMITTED}>Submitted</MenuItem>
            <MenuItem value={ClaimStatusEnum.MANAGER_APPROVED}>Manager Approved</MenuItem>
            <MenuItem value={ClaimStatusEnum.CHANGES_REQUESTED}>Changes Requested</MenuItem>
            <MenuItem value={ClaimStatusEnum.FINANCE_APPROVED}>Finance Approved</MenuItem>
            <MenuItem value={ClaimStatusEnum.PAID}>Paid</MenuItem>
            <MenuItem value={ClaimStatusEnum.REJECTED}>Rejected</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <MenuItem value="date_desc">Created: Newest first</MenuItem>
            <MenuItem value="date_asc">Created: Oldest first</MenuItem>
            <MenuItem value="amount_desc">Amount: High to Low</MenuItem>
            <MenuItem value="amount_asc">Amount: Low to High</MenuItem>
            <MenuItem value="expense_desc">Expense Date: Newest</MenuItem>
            <MenuItem value="expense_asc">Expense Date: Oldest</MenuItem>
          </TextField>

          {tab === "paid" && (
            <>
              <TextField
                type="month"
                size="small"
                label="Filter by month"
                slotProps={{ inputLabel: { shrink: true } }}
                value={monthFilter === "ALL" ? "" : monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value || "ALL");
                  setPage(1);
                }}
                className={styles.empSelect}
              />
              {monthFilter !== "ALL" && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setMonthFilter("ALL");
                    setPage(1);
                  }}
                >
                  Clear month
                </Button>
              )}
            </>
          )}
        </Box>

        {tab === "ready-for-payment" && (
          <Box className={styles.totalBanner}>
            <Typography>
              Total to pay: <strong>₹ {financeReadyForPaymentSum.toLocaleString("en-IN")}</strong>
            </Typography>
          </Box>
        )}

        {tab === "paid" && (
          <Box className={styles.totalBanner}>
            <Typography>
              Total paid {monthFilter !== "ALL" ? `for ${monthFilter}` : ""}:{" "}
              <strong>₹ {financePaidSum.toLocaleString("en-IN")}</strong>
            </Typography>
          </Box>
        )}

        <TableContainer className={styles.tableWrapper}>
          {(tabConfig.claims || []).length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography variant="body1">{loading ? "Loading..." : tabConfig.empty}</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={styles.tableHeadCell}>
                    {tab === "first-review" ? "Manager" : "Employee"}
                  </TableCell>
                  <TableCell className={styles.tableHeadCell}>Title</TableCell>
                  <TableCell className={styles.tableHeadCell}>Category</TableCell>
                  <TableCell className={styles.tableHeadCell}>Amount (INR)</TableCell>
                  {tab !== "ready-for-payment" && tab !== "paid" && (
                    <TableCell className={styles.tableHeadCell}>Expense Date</TableCell>
                  )}
                  {tab === "paid" && <TableCell className={styles.tableHeadCell}>Payment Reference</TableCell>}
                  {tab === "paid" && <TableCell className={styles.tableHeadCell}>Paid Date</TableCell>}
                  {tab !== "paid" && <TableCell className={styles.tableHeadCell}>Status</TableCell>}
                  {tab !== "paid" && <TableCell className={styles.tableHeadCell}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(tabConfig.claims || []).map((claim) => (
                  <TableRow key={claim.uuid} className={styles.clickableRow}>
                    <TableCell
                      className={styles.tableCell}
                      onClick={() => router.push(`/finance/claims/${claim.uuid}`)}
                    >
                      <strong>{claim.owner_name}</strong>
                    </TableCell>
                    <TableCell
                      className={styles.tableCell}
                      onClick={() => router.push(`/finance/claims/${claim.uuid}`)}
                    >
                      {claim.title}
                    </TableCell>
                    <TableCell className={styles.tableCell}>{claim.category}</TableCell>
                    <TableCell className={styles.tableCell}>
                      ₹ {claim.amount ? claim.amount.toLocaleString("en-IN") : "0"}
                    </TableCell>
                    {tab !== "ready-for-payment" && tab !== "paid" && (
                      <TableCell className={styles.tableCell}>{claim.expense_date}</TableCell>
                    )}
                    {tab === "paid" && (
                      <TableCell className={styles.tableCell}>
                        <strong>{claim.payment_reference || "N/A"}</strong>
                      </TableCell>
                    )}
                    {tab === "paid" && (
                      <TableCell className={styles.tableCell}>
                        {claim.paid_date ? new Date(claim.paid_date).toLocaleDateString() : "-"}
                      </TableCell>
                    )}
                    {tab !== "paid" && (
                      <TableCell className={styles.tableCell}>
                        <StatusBadge status={claim.status} />
                      </TableCell>
                    )}
                    {tab !== "paid" && (
                      <TableCell className={styles.tableCell}>
                        {tab === "first-review" && (
                          <Box className={styles.actionBtnGroup}>
                            <Button
                              variant="contained"
                              size="small"
                              className={styles.pageBtn}
                              onClick={() => setDialogState({ type: "firstReviewApprove", claim })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              className={styles.pageBtn}
                              onClick={() => setDialogState({ type: "firstReviewChanges", claim })}
                            >
                              Request changes
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              className={styles.pageBtn}
                              onClick={() => setDialogState({ type: "firstReviewReject", claim })}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {tab === "needs-approval" && (
                          <Box className={styles.actionBtnGroup}>
                            <Button
                              variant="contained"
                              size="small"
                              className={styles.pageBtn}
                              onClick={() => setDialogState({ type: "approve", claim })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              className={styles.pageBtn}
                              onClick={() => setDialogState({ type: "reject", claim })}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {tab === "ready-for-payment" && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            className={styles.pageBtn}
                            onClick={() => setDialogState({ type: "markPaid", claim })}
                          >
                            Mark paid
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {tabConfig.pages > 1 && (
          <Box className={styles.paginationRow}>
            <Typography variant="body2">
              Page {page} of {tabConfig.pages} ({tabConfig.total} total)
            </Typography>
            <Pagination
              count={tabConfig.pages}
              page={page}
              onChange={(_, p) => setPage(p)}
              variant="outlined"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Box>

      {dialogState && (
        <ActionDialog
          open={Boolean(dialogState)}
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onClose={() => setDialogState(null)}
          {...DIALOG_CONFIG[dialogState.type]}
        />
      )}
    </Box>
  );
}
