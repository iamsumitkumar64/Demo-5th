import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase/config/firebase.config";
import { ClaimEntity, CLAIM_FIRESTORE_COLLECTION } from "@/firebase/domain/claim/claim.entity";
import { QueryClaimDto } from "@/firebase/domain/claim/dto/query-claim.dto";
import { ClaimStatusEnum } from "@/firebase/domain/claim/enum/claim-status/claim-status.enum";

const paginate = <T>(items: T[], page: number = 1, limit: number = 10) => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;
  return {
    data: items.slice(skip, skip + limit),
    total,
    page,
    limit,
    totalPages,
  };
};

const clean = (data: any) => JSON.parse(JSON.stringify(data));

const applyCommonFiltersAndSort = (
  items: ClaimEntity[],
  queryDto: QueryClaimDto
): ClaimEntity[] => {
  let filtered = items;
  if (queryDto.category && queryDto.category !== "ALL") {
    filtered = filtered.filter((c) => c.category === queryDto.category);
  }
  if (queryDto.status && queryDto.status !== "ALL") {
    filtered = filtered.filter((c) => c.status === queryDto.status);
  }
  if (queryDto.sort_by) {
    filtered = filtered.slice().sort((a, b) => {
      if (queryDto.sort_by === "amount_desc") {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (queryDto.sort_by === "amount_asc") {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      if (queryDto.sort_by === "date_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (queryDto.sort_by === "expense_desc") {
        return (b.expense_date || "").localeCompare(a.expense_date || "");
      }
      if (queryDto.sort_by === "expense_asc") {
        return (a.expense_date || "").localeCompare(b.expense_date || "");
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }
  return filtered;
};

export const claimService = {
  async createClaim(claimData: Omit<ClaimEntity, "uuid" | "created_at" | "updated_at">) {
    const uuid = "claim_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const newClaim: ClaimEntity = {
      ...claimData,
      uuid,
      created_at: now,
      updated_at: now,
    };

    await setDoc(doc(db, CLAIM_FIRESTORE_COLLECTION, uuid), clean(newClaim));
    return newClaim;
  },

  async updateClaim(uuid: string, updates: Partial<ClaimEntity>) {
    const now = new Date().toISOString();

    const claimRef = doc(db, CLAIM_FIRESTORE_COLLECTION, uuid);
    const current = await getDoc(claimRef);
    if (!current.exists()) {
      throw new Error("This claim no longer exists");
    }
    const updated = {
      ...current.data(),
      ...updates,
      updated_at: now
    } as ClaimEntity;

    await updateDoc(claimRef, clean({ ...updates, updated_at: now }));
    return updated;
  },

  async deleteClaim(uuid: string) {
    await deleteDoc(doc(db, CLAIM_FIRESTORE_COLLECTION, uuid));
  },

  async getClaimById(uuid: string) {
    const snap = await getDoc(doc(db, CLAIM_FIRESTORE_COLLECTION, uuid));
    if (!snap.exists()) {
      return null;
    }

    return snap.data() as ClaimEntity;
  },

  async getUserClaims(queryClaimDto: QueryClaimDto) {
    const { page = 1, limit = 10, owner_uuid } = queryClaimDto;
    const q = owner_uuid
      ? query(collection(db, CLAIM_FIRESTORE_COLLECTION), where("owner_uuid", "==", owner_uuid))
      : query(collection(db, CLAIM_FIRESTORE_COLLECTION));

    const snap = await getDocs(q);
    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    all = applyCommonFiltersAndSort(all, queryClaimDto);
    return paginate(all, page, limit);
  },

  async getManagerPendingClaims(queryClaimDto: QueryClaimDto) {
    const { page = 1, limit = 10, reviewer_uuid, employee_name } = queryClaimDto;

    const snap = await getDocs(
      query(collection(db, CLAIM_FIRESTORE_COLLECTION), where("status", "==", ClaimStatusEnum.SUBMITTED))
    );

    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .filter((c) => {
        const matchesReviewer = c.reviewer_uuid === reviewer_uuid;
        const isNotSelf = c.owner_uuid !== reviewer_uuid;
        const isManagerType = c.reviewer_type === "MANAGER";
        return matchesReviewer && isNotSelf && isManagerType;
      })
      .sort((a, b) => {
        const timeA = new Date(a.submitted_at || a.created_at).getTime();
        const timeB = new Date(b.submitted_at || b.created_at).getTime();
        return timeA - timeB;
      });

    if (employee_name && employee_name !== "ALL") {
      all = all.filter((c) => c.owner_name === employee_name);
    }
    all = applyCommonFiltersAndSort(all, queryClaimDto);

    return paginate(all, page, limit);
  },

  async getManagerReviewedClaims(queryClaimDto: QueryClaimDto) {
    const { page = 1, limit = 10, reviewer_uuid, employee_name } = queryClaimDto;
    const snap = await getDocs(collection(db, CLAIM_FIRESTORE_COLLECTION));
    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .filter((claim) =>
        (claim.history || []).some(
          (h) =>
            (!reviewer_uuid || h.actor_uuid === reviewer_uuid) &&
            ["Approve", "Request changes", "Reject", "Approved", "Changes requested", "Rejected"].includes(h.action)
        )
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    if (employee_name && employee_name !== "ALL") {
      all = all.filter((c) => c.owner_name === employee_name);
    }
    all = applyCommonFiltersAndSort(all, queryClaimDto);

    return paginate(all, page, limit);
  },

  async getFinanceFirstReviewClaims(queryClaimDto: QueryClaimDto) {
    const { page = 1, limit = 10 } = queryClaimDto;
    const snap = await getDocs(
      query(collection(db, CLAIM_FIRESTORE_COLLECTION), where("status", "==", ClaimStatusEnum.SUBMITTED))
    );

    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .filter((c) => c.reviewer_type === "FINANCE" || c.owner_role === "Manager")
      .sort((a, b) => new Date(a.submitted_at || a.created_at).getTime() - new Date(b.submitted_at || b.created_at).getTime());

    all = applyCommonFiltersAndSort(all, queryClaimDto);
    return paginate(all, page, limit);
  },

  async getFinanceNeedsApprovalClaims(queryClaimDto: QueryClaimDto) {
    const { page = 1, limit = 10 } = queryClaimDto;
    const snap = await getDocs(
      query(collection(db, CLAIM_FIRESTORE_COLLECTION), where("status", "==", ClaimStatusEnum.MANAGER_APPROVED))
    );

    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .filter((c) => Number(c.amount) >= 10000)
      .sort((a, b) => new Date(a.submitted_at || a.created_at).getTime() - new Date(b.submitted_at || b.created_at).getTime());

    all = applyCommonFiltersAndSort(all, queryClaimDto);
    return paginate(all, page, limit);
  },

  async getFinanceReadyForPaymentClaims(
    queryClaimDto: QueryClaimDto
  ) {
    const { page = 1, limit = 10 } = queryClaimDto;
    const snap = await getDocs(collection(db, CLAIM_FIRESTORE_COLLECTION));

    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .filter(
        (c) =>
          (c.status === ClaimStatusEnum.MANAGER_APPROVED && Number(c.amount) < 10000) ||
          c.status === ClaimStatusEnum.FINANCE_APPROVED
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    all = applyCommonFiltersAndSort(all, queryClaimDto);
    const totalSum = all.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const paginated = paginate(all, page, limit);

    return {
      ...paginated,
      totalSum,
    };
  },

  async getFinancePaidClaims(
    queryClaimDto: QueryClaimDto
  ) {
    const { page = 1, limit = 10, month } = queryClaimDto;
    const snap = await getDocs(
      query(collection(db, CLAIM_FIRESTORE_COLLECTION), where("status", "==", ClaimStatusEnum.PAID))
    );

    let all = snap.docs
      .map((d) => d.data() as ClaimEntity)
      .sort((a, b) => new Date(b.paid_date || b.updated_at).getTime() - new Date(a.paid_date || a.updated_at).getTime());

    if (month && month !== "ALL") {
      all = all.filter((c) => c.paid_date && c.paid_date.startsWith(month));
    }
    all = applyCommonFiltersAndSort(all, queryClaimDto);

    const totalSum = all.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const paginated = paginate(all, page, limit);

    return {
      ...paginated,
      totalSum,
    };
  },
};
