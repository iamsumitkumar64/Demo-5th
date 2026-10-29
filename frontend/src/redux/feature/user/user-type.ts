import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";
import { UserEntity } from "@/firebase/domain/user/user.entity";

export type User = UserEntity;

export interface UserState {
  user: UserEntity | null;
  managers: UserEntity[];
  loading: boolean;
  error: string | null;
  status: "pending" | "succeed" | "rejected";
}
