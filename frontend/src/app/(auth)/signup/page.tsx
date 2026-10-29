"use client";

import { useEffect, useState } from "react";
import styles from "./signup.module.css";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupSchemaType } from "@/schemas/signup";
import { signupUser, fetchManagers } from "@/redux/feature/user/user-action";
import { useRouter } from "next/navigation";
import { Box, Button, MenuItem, TextField, Typography, CircularProgress, Link as MuiLink, Paper, RadioGroup, Radio, FormControlLabel } from "@mui/material";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";
import { enqueueSnackbar } from "notistack";
import Link from "next/link";
import { RootState } from "@/redux/store";

export default function SignupForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { managers = [] } = useAppSelector((state: RootState) => state.userReducer);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRoleEnum.EMPLOYEE,
      manager_uuid: "",
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    dispatch(fetchManagers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRole !== UserRoleEnum.EMPLOYEE) {
      setValue("manager_uuid", "");
    }
  }, [selectedRole, setValue]);

  const hasNoManagers = selectedRole === UserRoleEnum.EMPLOYEE && (managers || []).length === 0;

  const onSubmit = async (data: SignupSchemaType) => {
    setIsLoading(true);
    try {
      const selectedManager = (managers || []).find((m) => m.uuid === data.manager_uuid);
      const res = await dispatch(signupUser({ ...data, manager_name: selectedManager?.username })).unwrap();
      enqueueSnackbar("Account created", { variant: "info" });
      const role = res?.data?.user?.role?.toLowerCase() || "employee";
      router.replace(`/${role}/claims`);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Registration failed", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className={styles.container}>
      <Paper variant="outlined" className={styles.formWrapper}>
        <Typography variant="caption" className={styles.caption}>EXPENSE CLAIMS</Typography>
        <Typography variant="h5" className={styles.title}>Create an account</Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <TextField
            label="Full name"
            size="small"
            fullWidth
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            {...register("username")}
          />
          <TextField
            label="Email"
            type="email"
            size="small"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
          />

          <Box className={styles.row}>
            <TextField
              label="Password"
              type="password"
              size="small"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register("password")}
            />
            <TextField
              label="Confirm password"
              type="password"
              size="small"
              fullWidth
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Box>

          <Box>
            <Typography variant="body2">Role</Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  row
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={styles.roleGroup}
                >
                  <FormControlLabel
                    value={UserRoleEnum.EMPLOYEE}
                    control={<Radio size="small" />}
                    label="Employee"
                    className={field.value === UserRoleEnum.EMPLOYEE ? styles.roleCardActive : styles.roleCard}
                  />
                  <FormControlLabel
                    value={UserRoleEnum.MANAGER}
                    control={<Radio size="small" />}
                    label="Manager"
                    className={field.value === UserRoleEnum.MANAGER ? styles.roleCardActive : styles.roleCard}
                  />
                  <FormControlLabel
                    value={UserRoleEnum.FINANCE}
                    control={<Radio size="small" />}
                    label="Finance"
                    className={field.value === UserRoleEnum.FINANCE ? styles.roleCardActive : styles.roleCard}
                  />
                </RadioGroup>
              )}
            />
          </Box>

          {selectedRole === UserRoleEnum.EMPLOYEE && (
            <Box className={styles.managerBox}>
              <Typography variant="body2">Manager (required for employees)</Typography>
              {hasNoManagers ? (
                <Typography className={styles.noManagerText}>No managers are registered yet</Typography>
              ) : (
                <Controller
                  name="manager_uuid"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      size="small"
                      fullWidth
                      error={Boolean(errors.manager_uuid)}
                      helperText={errors.manager_uuid?.message}
                    >
                      {(managers || []).map((m) => (
                        <MenuItem key={m.uuid} value={m.uuid}>{m.username}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}
              <Typography variant="caption" color="textSecondary">
                Shown only when Employee is selected. Lists all registered managers.
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={hasNoManagers || isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : "Sign up"}
          </Button>
        </Box>

        <Box className={styles.footer}>
          <Typography variant="body2">
            Already have an account? <MuiLink component={Link} href="/login">Log in</MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
