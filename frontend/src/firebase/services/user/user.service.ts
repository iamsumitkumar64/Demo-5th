import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase/config/firebase.config";
import { UserEntity, USER_FIRESTORE_COLLECTION } from "@/firebase/domain/user/user.entity";
import { CreateUserDto } from "@/firebase/domain/user/dto/create-user.dto";
import { LoginUserDto } from "@/firebase/domain/user/dto/login-user.dto";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";

export const userService = {
  async registerUser(createUserDto: CreateUserDto) {
    const cred = await createUserWithEmailAndPassword(
      auth,
      createUserDto.email,
      createUserDto.password
    );

    let managerName = createUserDto.manager_name;
    if (createUserDto.manager_uuid && !managerName) {
      try {
        const managerDoc = await getDoc(doc(db, USER_FIRESTORE_COLLECTION, createUserDto.manager_uuid));
        if (managerDoc.exists()) {
          managerName = managerDoc.data()?.username;
        }
      } catch {
        managerName = undefined;
      }
    }

    const now = new Date().toISOString();
    const userObj: UserEntity = {
      uuid: cred.user.uid,
      email: createUserDto.email,
      username: createUserDto.username,
      role: createUserDto.role,
      created_at: now,
      updated_at: now,
    };

    if (createUserDto.manager_uuid) {
      userObj.manager_uuid = createUserDto.manager_uuid;
    }
    if (managerName) {
      userObj.manager_name = managerName;
    }

    await setDoc(doc(db, USER_FIRESTORE_COLLECTION, cred.user.uid), userObj);

    return userObj;
  },

  async loginUser(loginUserDto: LoginUserDto) {
    const cred = await signInWithEmailAndPassword(
      auth,
      loginUserDto.email,
      loginUserDto.password
    );
    const snap = await getDoc(doc(db, USER_FIRESTORE_COLLECTION, cred.user.uid));
    if (!snap.exists()) {
      throw new Error("User record not found in database");
    }
    return snap.data() as UserEntity;
  },

  async logoutUser() {
    await signOut(auth);
  },

  async getManagers() {
    const q = query(
      collection(db, USER_FIRESTORE_COLLECTION),
      where("role", "==", UserRoleEnum.MANAGER)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserEntity);
  },
};
