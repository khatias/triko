// --- Minimal local types (align with your DB) ---
export type Profile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  locale: string | null;
  marketing_opt_in: boolean;
  default_currency: string | null;
  created_at: string;
  updated_at: string;
  sex: string | null;
  birth_date: string | null;
};
