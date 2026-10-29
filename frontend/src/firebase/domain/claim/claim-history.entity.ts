export interface ClaimHistoryEntity {
  uuid: string;
  action: string;
  actor_uuid: string;
  actor_name: string;
  actor_role: string;
  comment?: string;
  created_at: string;
}
