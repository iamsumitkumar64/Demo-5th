"use client";

import { useState } from "react";
import styles from "./login.module.css";
import { useAppDispatch } from "@/redux/hooks.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginSchemaType } from "@/schemas/login";
import { loginUser } from "@/redux/feature/user/user-action";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, Alert, CircularProgress, Link as MuiLink, Paper } from "@mui/material";
import Link from "next/link";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");
  const isButtonDisabled = !emailValue || !passwordValue || isLoading;

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await dispatch(loginUser(data)).unwrap();
      const role = res?.data?.user?.role?.toLowerCase() || "employee";
      router.replace(`/${role}/claims`);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(typeof error == 'string' ? error : "Incorrect email or password");
      setValue("password", "");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className={styles.container}>
      <Paper variant="outlined" className={styles.formWrapper}>
        <Typography variant="h5" className={styles.title}>
          Log in
        </Typography>

        {errorMessage && (
          <Alert severity="error" className={styles.errorBanner}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <TextField
            label="Email"
            type="email"
            size="small"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
          />

          <TextField
            label="Password"
            type="password"
            size="small"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register("password")}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isButtonDisabled}
            className={styles.submitBtn}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : "Log in"}
          </Button>
        </Box>

        <Box className={styles.footer}>
          <Typography variant="body2">
            Don&apos;t have an account?{" "}
            <MuiLink component={Link} href="/signup">Create an account</MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
