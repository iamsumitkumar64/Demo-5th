"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchPendingReviewClaims, fetchReviewedClaims } from "@/redux/feature/claim/claim-action";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import { Box, Typography, Tabs, Tab, MenuItem, TextField, Badge, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import styles from "./manager-claims.module.css";

export default function ManagerClaimsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const {
    pendingClaims = [],
    reviewedClaims = [],
    pendingTotal = 0,
    pendingTotalPages = 1,
    reviewedTotal = 0,
    reviewedTotalPages = 1,
    loading,
  } = useAppSelector((state: RootState) => state.claimReducer);

  const [tab, setTab] = useState<"pending" | "reviewed">("pending");
  const [page, setPage] = useState(1);
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    if (!user?.uuid) return;
    const queryParams = {
      reviewer_uuid: user.uuid,
      page,
      limit: 10,
      category: categoryFilter !== "ALL" ? (categoryFilter as ClaimCategoryEnum) : undefined,
      status: statusFilter !== "ALL" ? (statusFilter as ClaimStatusEnum) : undefined,
      sort_by: sortBy,
      employee_name: employeeFilter !== "ALL" ? employeeFilter : undefined,
    };
    if (tab === "pending") {
      dispatch(fetchPendingReviewClaims(queryParams));
    } else {
      dispatch(fetchReviewedClaims(queryParams));
    }
  }, [dispatch, user?.uuid, tab, page, categoryFilter, statusFilter, sortBy, employeeFilter]);

  const allRelevantClaims = tab === "pending" ? pendingClaims : reviewedClaims;
  const uniqueEmployees = Array.from(
    new Set((allRelevantClaims || []).map((c) => c.owner_name).filter(Boolean))
  );
  const isPending = tab === "pending";
  const claims = isPending ? pendingClaims : reviewedClaims;
  const currentTotal = isPending ? pendingTotal : reviewedTotal;
  const currentTotalPages = isPending ? pendingTotalPages : reviewedTotalPages;

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Box className={styles.topBar}>
          <Typography variant="h5">
            <strong>Review Queue</strong>
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
              value="pending"
              label={<Badge badgeContent={pendingTotal} color="error">Pending</Badge>}
            />
            <Tab value="reviewed" label="Reviewed" />
          </Tabs>
        </Box>

        <Box className={styles.filterBar}>
          <TextField
            select
            size="small"
            label="Employee"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            className={styles.empSelect}
          >
            <MenuItem value="ALL">All employees</MenuItem>
            {(uniqueEmployees || []).map((emp) => (
              <MenuItem key={emp} value={emp}>{emp}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className={styles.catSelect}
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
            className={styles.statusSelect}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {isPending ? (
              <MenuItem value={ClaimStatusEnum.SUBMITTED}>Submitted</MenuItem>
            ) : (
              <>
                <MenuItem value={ClaimStatusEnum.MANAGER_APPROVED}>Manager Approved</MenuItem>
                <MenuItem value={ClaimStatusEnum.CHANGES_REQUESTED}>Changes Requested</MenuItem>
                <MenuItem value={ClaimStatusEnum.REJECTED}>Rejected</MenuItem>
                <MenuItem value={ClaimStatusEnum.FINANCE_APPROVED}>Finance Approved</MenuItem>
                <MenuItem value={ClaimStatusEnum.PAID}>Paid</MenuItem>
              </>
            )}
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
            className={styles.sortSelect}
          >
            <MenuItem value="date_desc">Created: Newest first</MenuItem>
            <MenuItem value="date_asc">Created: Oldest first</MenuItem>
            <MenuItem value="amount_desc">Amount: High to Low</MenuItem>
            <MenuItem value="amount_asc">Amount: Low to High</MenuItem>
            <MenuItem value="expense_desc">Expense Date: Newest</MenuItem>
            <MenuItem value="expense_asc">Expense Date: Oldest</MenuItem>
          </TextField>
        </Box>

        <TableContainer className={styles.tableWrapper}>
          {(claims || []).length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography variant="body1">
                {loading
                  ? "Loading..."
                  : isPending
                  ? "Nothing to review"
                  : "No reviewed claims yet"}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={styles.tableHeadCell}>Employee</TableCell>
                  <TableCell className={styles.tableHeadCell}>Title</TableCell>
                  <TableCell className={styles.tableHeadCell}>Category</TableCell>
                  <TableCell className={styles.tableHeadCell}>Amount (INR)</TableCell>
                  {isPending ? (
                    <>
                      <TableCell className={styles.tableHeadCell}>Expense Date</TableCell>
                      <TableCell className={styles.tableHeadCell}>Submitted Date</TableCell>
                      <TableCell className={styles.tableHeadCell}>Days Waiting</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className={styles.tableHeadCell}>Action Taken</TableCell>
                      <TableCell className={styles.tableHeadCell}>Action Date</TableCell>
                      <TableCell className={styles.tableHeadCell}>Status</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {(claims || []).map((claim) => {
                  const lastAction = isPending
                    ? null
                    : (claim.history || [])
                        .slice()
                        .reverse()
                        .find((h) => h.actor_uuid === user?.uuid) ||
                      (claim.history || [])[(claim.history || []).length - 1];
                  const daysWaiting = Math.floor(
                    Math.abs(Date.now() - new Date(claim.submitted_at || claim.created_at).getTime()) /
                      86400000
                  );

                  return (
                    <TableRow
                      key={claim.uuid}
                      onClick={() => router.push(`/manager/claims/${claim.uuid}`)}
                      className={styles.clickableRow}
                    >
                      <TableCell className={styles.tableCell}>
                        <strong>{claim.owner_name}</strong>
                      </TableCell>
                      <TableCell className={styles.tableCell}>{claim.title}</TableCell>
                      <TableCell className={styles.tableCell}>{claim.category}</TableCell>
                      <TableCell className={styles.tableCell}>
                        ₹ {claim.amount ? claim.amount.toLocaleString("en-IN") : "0"}
                      </TableCell>
                      {isPending ? (
                        <>
                          <TableCell className={styles.tableCell}>{claim.expense_date}</TableCell>
                          <TableCell className={styles.tableCell}>
                            {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className={styles.tableCell}>{daysWaiting} days</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className={styles.tableCell}>{lastAction?.action || "-"}</TableCell>
                          <TableCell className={styles.tableCell}>
                            {lastAction?.created_at
                              ? new Date(lastAction.created_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <StatusBadge status={claim.status} />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {currentTotalPages > 1 && (
          <Box className={styles.paginationRow}>
            <Typography variant="body2">
              Page {page} of {currentTotalPages} ({currentTotal} total)
            </Typography>
            <Pagination
              count={currentTotalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              variant="outlined"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
