
export type AuthResult = {
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
  email?: string;
};
export type AuthAction = "signup" | "login" | "forgot";

export type SafeUser = {
  id: string;
  email: string;
  full_name?: string;
} | null;
