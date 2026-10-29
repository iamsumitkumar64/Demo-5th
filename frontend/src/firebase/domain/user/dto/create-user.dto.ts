import { UserRoleEnum } from "../enum/user-role/user-role.enum";

export interface CreateUserDto {
  email: string;
  password: string;
  username: string;
  role: UserRoleEnum;
  manager_uuid?: string;
  manager_name?: string;
}
