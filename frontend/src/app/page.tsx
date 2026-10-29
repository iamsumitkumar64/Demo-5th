"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { Box, CircularProgress } from "@mui/material";
import styles from "./home.module.css";

export default function Home() {
  const router = useRouter();
  const { user } = useAppSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(`/${user.role.toLowerCase()}/claims`);
  }, [user, router]);

  return (
    <Box className={styles.loadingContainer}>
      <CircularProgress />
    </Box>
  );
}
