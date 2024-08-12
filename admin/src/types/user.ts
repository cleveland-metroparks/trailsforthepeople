export type ApiAccessToken = {
    id: number,
    tokenable_type: string,
    tokenable_id: string,
    name: string,
    abilities: string,
    last_used_at: string, // timestamp
    created_at: string, // timestamp
    updated_at: string, // timestamp
  };