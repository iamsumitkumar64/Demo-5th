export interface ReviewClaimDto {
  claim_uuid: string;
  action: "Approve" | "Request changes" | "Reject";
  comment?: string;
  reviewer_uuid: string;
  reviewer_name: string;
}
