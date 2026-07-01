export interface JwtUser {
  id: number;
  email: string;
  roles: string[]; // 👈 IMPORTANT
}
