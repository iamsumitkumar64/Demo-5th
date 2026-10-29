"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { claimSubmitSchema, claimDraftSchema, ClaimSubmitSchemaType } from "@/schemas/claim";
import { createDraftClaim, submitNewClaim } from "@/redux/feature/claim/claim-action";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Button, MenuItem, TextField, Typography, Paper } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./new-claim.module.css";

export default function NewEmployeeClaimPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.userReducer);

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<ClaimSubmitSchemaType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ClaimSubmitSchemaType>({
    resolver: zodResolver(claimSubmitSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      category: ClaimCategoryEnum.TRAVEL,
      amount: 0,
      expense_date: new Date().toISOString().split("T")[0],
      description: "",
      receipt_url: "",
    },
  });

  const titleVal = watch("title") || "";
  const isReceiptRequired = (watch("amount") || 0) >= 2000;
  const isEmployee = user?.role === UserRoleEnum.EMPLOYEE;
  const reviewerType: "MANAGER" | "FINANCE" = isEmployee ? "MANAGER" : "FINANCE";
  const reviewerUuid = isEmployee ? user?.manager_uuid : undefined;
  const reviewerName = isEmployee ? user?.manager_name || "Manager" : "Finance team";

  const handleSaveDraft = async () => {
    const values = getValues();
    const draftValidation = claimDraftSchema.safeParse(values);
    if (!draftValidation.success) {
      enqueueSnackbar(draftValidation.error.issues[0]?.message || "Invalid draft data", { variant: "error" });
      return;
    }
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = await dispatch(
        createDraftClaim({
          title: values.title,
          category: values.category,
          amount: Number(values.amount) || 0,
          expense_date: values.expense_date,
          description: values.description || "",
          receipt_url: values.receipt_url || undefined,
          owner_uuid: user.uuid,
          owner_name: user.username,
          owner_role: user.role,
          reviewer_type: reviewerType,
          reviewer_uuid: reviewerUuid,
          reviewer_name: reviewerName,
          actor: { uuid: user.uuid, name: user.username, role: user.role },
        })
      ).unwrap();
      enqueueSnackbar("Draft saved", { variant: "info" });
      router.push(`/employee/claims/${res.data.uuid}`);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Failed to save draft", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingSubmitData || !user) return;
    setIsSubmitting(true);
    try {
      const res = await dispatch(
        submitNewClaim({
          title: pendingSubmitData.title,
          category: pendingSubmitData.category,
          amount: Number(pendingSubmitData.amount),
          expense_date: pendingSubmitData.expense_date,
          description: pendingSubmitData.description,
          receipt_url: pendingSubmitData.receipt_url || undefined,
          owner_uuid: user.uuid,
          owner_name: user.username,
          owner_role: user.role,
          reviewer_type: reviewerType,
          reviewer_uuid: reviewerUuid,
          reviewer_name: reviewerName,
          actor: { uuid: user.uuid, name: user.username, role: user.role },
        })
      ).unwrap();
      enqueueSnackbar("Claim submitted", { variant: "info" });
      setIsSubmitDialogOpen(false);
      router.push(`/employee/claims/${res.data.uuid}`);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Failed to submit claim", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Typography variant="h5"><strong>New Claim</strong></Typography>

        <Paper
          variant="outlined"
          component="form"
          onSubmit={handleSubmit((data) => {
            setPendingSubmitData(data);
            setIsSubmitDialogOpen(true);
          })}
          className={styles.formBox}
        >
          <TextField
            label="Title"
            size="small"
            fullWidth
            required
            error={Boolean(errors.title)}
            helperText={errors.title?.message || "5 to 80 characters"}
            {...register("title")}
          />
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Category"
                size="small"
                fullWidth
                required
                error={Boolean(errors.category)}
                helperText={errors.category?.message}
              >
                <MenuItem value={ClaimCategoryEnum.TRAVEL}>Travel</MenuItem>
                <MenuItem value={ClaimCategoryEnum.FOOD}>Food</MenuItem>
                <MenuItem value={ClaimCategoryEnum.EQUIPMENT}>Equipment</MenuItem>
                <MenuItem value={ClaimCategoryEnum.OTHER}>Other</MenuItem>
              </TextField>
            )}
          />
          <TextField
            label="Amount (INR)"
            type="number"
            size="small"
            fullWidth
            required
            error={Boolean(errors.amount)}
            helperText={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />
          <TextField
            label="Expense Date"
            type="date"
            size="small"
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.expense_date)}
            helperText={errors.expense_date?.message}
            {...register("expense_date")}
          />
          <TextField
            label="Description"
            multiline
            rows={4}
            size="small"
            fullWidth
            required
            error={Boolean(errors.description)}
            helperText={errors.description?.message || "At least 20 characters"}
            {...register("description")}
          />
          <TextField
            label={isReceiptRequired ? "Receipt URL (required)" : "Receipt URL (optional)"}
            size="small"
            fullWidth
            required={isReceiptRequired}
            placeholder="https://example.com/receipt.pdf"
            error={Boolean(errors.receipt_url)}
            helperText={errors.receipt_url?.message}
            {...register("receipt_url")}
          />

          <Box className={styles.actionsBar}>
            <Button
              variant="outlined"
              onClick={() => router.push("/employee/claims")}
              className={styles.btn}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={titleVal.trim().length === 0 || isSubmitting}
              className={styles.btn}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              className={styles.btn}
            >
              Submit
            </Button>
          </Box>
        </Paper>
      </Box>

      {pendingSubmitData && (
        <ActionDialog
          open={isSubmitDialogOpen}
          title="Confirm Submission"
          description="Are you ready to submit this expense claim for review?"
          details={[
            { label: "Title", value: pendingSubmitData.title },
            { label: "Amount", value: `₹ ${Number(pendingSubmitData.amount).toLocaleString("en-IN")}` },
            { label: isEmployee ? "Manager" : "Reviewer", value: reviewerName },
          ]}
          confirmButtonText="Submit Claim"
          isLoading={isSubmitting}
          onConfirm={handleConfirmSubmit}
          onClose={() => setIsSubmitDialogOpen(false)}
        />
      )}
    </Box>
  );
}
