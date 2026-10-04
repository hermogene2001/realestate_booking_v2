export enum Role {
  TENANT = 'TENANT',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  language: string;
  walletAddress: string | null;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'isBanned'>;
