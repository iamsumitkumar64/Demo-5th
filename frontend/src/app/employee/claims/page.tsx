"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { fetchUserClaims } from "@/redux/feature/claim/claim-action";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import StatusBadge from "@/component/status-badge/status-badge";
import { Box, Typography, Button, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem } from "@mui/material";
import styles from "./employee-claims.module.css";

export default function EmployeeClaimsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const {
    claims = [],
    total = 0,
    totalPages = 1,
    loading,
  } = useAppSelector((state: RootState) => state.claimReducer);

  useEffect(() => {
    if (user?.uuid) {
      dispatch(
        fetchUserClaims({
          owner_uuid: user.uuid,
          page,
          limit: 10,
          category: categoryFilter !== "ALL" ? (categoryFilter as ClaimCategoryEnum) : undefined,
          status: statusFilter !== "ALL" ? (statusFilter as ClaimStatusEnum) : undefined,
          sort_by: sortBy,
        })
      );
    }
  }, [dispatch, user?.uuid, page, categoryFilter, statusFilter, sortBy]);

  const allClaims = claims || [];
  const needsActionCount = allClaims.filter(
    (claim) => claim.status === ClaimStatusEnum.CHANGES_REQUESTED
  ).length;

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Box className={styles.topBar}>
          <Box>
            <Typography variant="h5">
              <strong>My Claims</strong>
            </Typography>
            <Box className={styles.summaryBox}>
              <Typography className={styles.summaryItem}>
                Total: <strong>{total}</strong>
              </Typography>
              {needsActionCount > 0 && (
                <Typography className={styles.summaryItem}>
                  Needs your action: <strong>{needsActionCount}</strong>
                </Typography>
              )}
            </Box>
          </Box>

          <Button
            variant="contained"
            className={styles.actionButton}
            onClick={() => router.push("/employee/claims/new")}
          >
            New claim
          </Button>
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
            <MenuItem value={ClaimStatusEnum.DRAFT}>Draft</MenuItem>
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
        </Box>

        <TableContainer className={styles.tableWrapper}>
          {allClaims.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography variant="body1">
                {loading
                  ? "Loading claims..."
                  : "No claims found. Click 'New claim' to create one."}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={styles.tableHeadCell}>Title</TableCell>
                  <TableCell className={styles.tableHeadCell}>Category</TableCell>
                  <TableCell className={styles.tableHeadCell}>Amount (INR)</TableCell>
                  <TableCell className={styles.tableHeadCell}>Expense Date</TableCell>
                  <TableCell className={styles.tableHeadCell}>Status</TableCell>
                  <TableCell className={styles.tableHeadCell}>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(allClaims || []).map((claim) => (
                  <TableRow
                    key={claim.uuid}
                    onClick={() => router.push(`/employee/claims/${claim.uuid}`)}
                    className={styles.clickableRow}
                  >
                    <TableCell className={styles.tableCell}>
                      <strong>{claim.title}</strong>
                    </TableCell>
                    <TableCell className={styles.tableCell}>{claim.category}</TableCell>
                    <TableCell className={styles.tableCell}>
                      ₹ {claim.amount ? claim.amount.toLocaleString("en-IN") : "0"}
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {claim.expense_date || "-"}
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <StatusBadge status={claim.status} />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {claim.created_at
                        ? new Date(claim.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {totalPages > 1 && (
          <Box className={styles.paginationRow}>
            <Typography className={styles.summaryItem}>
              Page {page} of {totalPages}
            </Typography>
            <Pagination
              count={totalPages}
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
