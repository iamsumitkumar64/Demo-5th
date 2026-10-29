"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Toolbar, Box, Button, Typography, Badge } from "@mui/material";
import { logoutUser } from "@/redux/feature/user/user-action";
import { fetchPendingReviewClaims, fetchFinanceFirstReviewClaims, fetchFinanceNeedsApprovalClaims, fetchFinanceReadyForPaymentClaims } from "@/redux/feature/claim/claim-action";
import { RootState } from "@/redux/store";
import styles from "./header-comp.module.css";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";

export default function HeaderComp() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const {
    pendingClaims = [],
    financeFirstReviewTotal = 0,
    financeNeedsApprovalTotal = 0,
    financeReadyForPaymentTotal = 0,
  } = useAppSelector((state: RootState) => state.claimReducer);

  const pendingCount = (pendingClaims || []).length;
  const financePendingCount =
    (financeFirstReviewTotal || 0) +
    (financeNeedsApprovalTotal || 0) +
    (financeReadyForPaymentTotal || 0);

  const isManager = user?.role === UserRoleEnum.MANAGER;
  const isFinance = user?.role === UserRoleEnum.FINANCE;

  useEffect(() => {
    if (isFinance) {
      dispatch(fetchFinanceFirstReviewClaims({ page: 1, limit: 10 }));
      dispatch(fetchFinanceNeedsApprovalClaims({ page: 1, limit: 10 }));
      dispatch(fetchFinanceReadyForPaymentClaims({ page: 1, limit: 10 }));
    } else if (isManager && user?.uuid) {
      dispatch(
        fetchPendingReviewClaims({
          reviewer_uuid: user.uuid,
          page: 1,
          limit: 10,
        })
      );
    }
  }, [dispatch, isFinance, isManager, user?.uuid]);

  const handleLogOut = async () => {
    await dispatch(logoutUser()).unwrap();
    router.replace("/login");
    router.refresh();
  };

  return (
    <AppBar position="static" color="inherit" elevation={0} className={styles.header}>
      <Toolbar disableGutters className={styles.toolbar}>
        <Box className={styles.leftContainer}>
          <Typography
            onClick={() => router.push(`/${user?.role?.toLowerCase() || "employee"}/claims`)}
            className={styles.title}
          >
            Expense Claims
          </Typography>

          {user && (
            <Box className={styles.navLinks}>
              {isFinance && (
                <Badge badgeContent={financePendingCount} color="error">
                  <Button
                    variant={pathname.startsWith("/finance/claims") ? "contained" : "outlined"}
                    size="small"
                    className={styles.navButton}
                    onClick={() => router.push("/finance/claims")}
                  >
                    Finance Queue
                  </Button>
                </Badge>
              )}

              {isManager && (
                <Badge badgeContent={pendingCount} color="error">
                  <Button
                    variant={pathname.startsWith("/manager/claims") ? "contained" : "outlined"}
                    size="small"
                    className={styles.navButton}
                    onClick={() => router.push("/manager/claims")}
                  >
                    Review Queue
                  </Button>
                </Badge>
              )}

              {!isFinance && (
                <Button
                  variant={pathname.startsWith("/employee/claims") ? "contained" : "outlined"}
                  size="small"
                  className={styles.navButton}
                  onClick={() => router.push("/employee/claims")}
                >
                  My Claims
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Box className={styles.rightContainer}>
          {user ? (
            <>
              <Box className={styles.userInfo}>
                <Typography variant="body2">{user.username}</Typography>
                <Typography variant="caption">({user.role})</Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                className={styles.logoutButton}
                onClick={handleLogOut}
              >
                Log out
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push("/login")}
            >
              Log in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
