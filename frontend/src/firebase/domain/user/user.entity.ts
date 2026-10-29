import { UserRoleEnum } from "./enum/user-role/user-role.enum";

export const USER_FIRESTORE_COLLECTION = "users";

export interface UserEntity {
  uuid: string;
  email: string;
  username: string;
  role: UserRoleEnum;
  manager_uuid?: string;
  manager_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
