// Shape returned by GET {VITE_MAPS_API_BASE_PATH}/user — the authenticated
// Sanctum User model, returned at the top level (no {success, data, message}
// envelope). Keys are snake_case, matching the DB columns.
export type User = {
  id: number;
  name: string;
  username: string;
  email: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  guid: string | null;
  domain: string | null;
};

export type ApiAccessToken = {
  id: number;
  tokenable_type: string;
  tokenable_id: string;
  name: string;
  abilities: string;
  last_used_at: string; // timestamp
  created_at: string; // timestamp
  updated_at: string; // timestamp
};
