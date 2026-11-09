export type LicenseTier = "normal" | "pro";

export type LicensePayload = {
  v: number;
  product: string;
  id: string;
  email: string;
  tier: LicenseTier;
  iat: number;
  expires: number | null;
};
