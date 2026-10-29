"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { RootState } from "@/redux/store";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { claimSubmitSchema, claimDraftSchema, ClaimSubmitSchemaType } from "@/schemas/claim";
import { fetchClaimById, saveChangesClaim, resubmitClaim, submitExistingDraft } from "@/redux/feature/claim/claim-action";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";
import HeaderComp from "@/component/header-comp/header-comp";
import ActionDialog from "@/component/action-dialog/action-dialog";
import { Box, Button, MenuItem, TextField, Typography, CircularProgress, Alert, Paper } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import styles from "./edit-claim.module.css";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default function EditEmployeeClaimPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { uuid } = use(params);

  const { user } = useAppSelector((state: RootState) => state.userReducer);
  const { currentClaim, loading } = useAppSelector((state: RootState) => state.claimReducer);

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<ClaimSubmitSchemaType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
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
      expense_date: "",
      description: "",
      receipt_url: "",
    },
  });

  useEffect(() => {
    if (uuid) dispatch(fetchClaimById(uuid));
  }, [dispatch, uuid]);

  useEffect(() => {
    if (currentClaim) {
      reset({
        title: currentClaim.title || "",
        category: currentClaim.category || ClaimCategoryEnum.TRAVEL,
        amount: currentClaim.amount || 0,
        expense_date: currentClaim.expense_date || "",
        description: currentClaim.description || "",
        receipt_url: currentClaim.receipt_url || "",
      });
    }
  }, [currentClaim, reset]);

  if (loading || !currentClaim) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}><CircularProgress /></Box>
      </Box>
    );
  }

  if (currentClaim.status === ClaimStatusEnum.REJECTED || currentClaim.status === ClaimStatusEnum.PAID) {
    return (
      <Box>
        <HeaderComp />
        <Box className={styles.container}>
          <Alert severity="warning">This claim is finalized ({currentClaim.status}) and cannot be edited.</Alert>
          <Box>
            <Button
              variant="outlined"
              onClick={() => router.push(`/employee/claims/${uuid}`)}
              className={styles.btn}
            >
              View Claim Details
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const isReceiptRequired = (watch("amount") || 0) >= 2000;
  const isChangesRequested = currentClaim.status === ClaimStatusEnum.CHANGES_REQUESTED;
  const isDraft = currentClaim.status === ClaimStatusEnum.DRAFT;
  const latestComment = (currentClaim.history || [])
    .slice()
    .reverse()
    .find((h) => h.action === "Changes requested")?.comment;

  const handleSaveChangesOnly = async () => {
    if (!user) return;
    const values = getValues();
    setIsSubmitting(true);
    try {
      if (isDraft) {
        const valRes = claimDraftSchema.safeParse(values);
        if (!valRes.success) {
          enqueueSnackbar(valRes.error.issues[0]?.message || "Invalid draft data", { variant: "error" });
          return;
        }
      }
      await dispatch(
        saveChangesClaim({
          uuid,
          updates: {
            title: values.title,
            category: values.category,
            amount: Number(values.amount) || 0,
            expense_date: values.expense_date,
            description: values.description,
            receipt_url: values.receipt_url || undefined,
          },
          actor: { uuid: user.uuid, name: user.username, role: user.role },
        })
      ).unwrap();
      enqueueSnackbar("Changes saved", { variant: "info" });
      router.push(`/employee/claims/${uuid}`);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Failed to save changes", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingSubmitData || !user) return;
    setIsSubmitting(true);
    try {
      const updates = {
        title: pendingSubmitData.title,
        category: pendingSubmitData.category,
        amount: Number(pendingSubmitData.amount),
        expense_date: pendingSubmitData.expense_date,
        description: pendingSubmitData.description,
        receipt_url: pendingSubmitData.receipt_url || undefined,
      };
      const actor = { uuid: user.uuid, name: user.username, role: user.role };
      if (isChangesRequested) {
        await dispatch(resubmitClaim({ uuid, updates, actor })).unwrap();
        enqueueSnackbar("Claim resubmitted", { variant: "info" });
      } else {
        await dispatch(submitExistingDraft({ uuid, updates, actor })).unwrap();
        enqueueSnackbar("Claim submitted", { variant: "info" });
      }
      setIsSubmitDialogOpen(false);
      router.push(`/employee/claims/${uuid}`);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(typeof err == "string" ? err : "Failed to submit claim", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewerName =
    currentClaim.reviewer_name ||
    (currentClaim.reviewer_type === "FINANCE" ||
    currentClaim.owner_role === UserRoleEnum.MANAGER ||
    user?.role === UserRoleEnum.MANAGER
      ? "Finance team"
      : "Manager");

  return (
    <Box>
      <HeaderComp />
      <Box className={styles.container}>
        <Typography variant="h5">
          <strong>{isChangesRequested ? "Edit & Resubmit Claim" : "Edit Draft Claim"}</strong>
        </Typography>

        {isChangesRequested && latestComment && (
          <Alert severity="warning"><strong>Reviewer feedback:</strong> {latestComment}</Alert>
        )}

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
              onClick={() => router.push(`/employee/claims/${uuid}`)}
              className={styles.btn}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={handleSaveChangesOnly}
              disabled={isSubmitting}
              className={styles.btn}
            >
              {isChangesRequested ? "Save changes" : "Save draft"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              className={styles.btn}
            >
              {isChangesRequested ? "Resubmit" : "Submit"}
            </Button>
          </Box>
        </Paper>
      </Box>

      {pendingSubmitData && (
        <ActionDialog
          open={isSubmitDialogOpen}
          title={isChangesRequested ? "Confirm Resubmission" : "Confirm Submission"}
          description="Are you ready to submit this revised claim for review?"
          details={[
            { label: "Title", value: pendingSubmitData.title },
            { label: "Amount", value: `₹ ${Number(pendingSubmitData.amount).toLocaleString("en-IN")}` },
            {
              label:
                currentClaim.reviewer_type === "FINANCE" || user?.role === UserRoleEnum.MANAGER
                  ? "Reviewer"
                  : "Manager",
              value: reviewerName,
            },
          ]}
          confirmButtonText={isChangesRequested ? "Resubmit Claim" : "Submit Claim"}
          isLoading={isSubmitting}
          onConfirm={handleConfirmSubmit}
          onClose={() => setIsSubmitDialogOpen(false)}
        />
      )}
    </Box>
  );
}
