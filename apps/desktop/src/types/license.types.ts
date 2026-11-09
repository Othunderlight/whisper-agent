export type LicensePayload = {
  v: number;
  product: string;
  id: string;
  email: string;
  tier: string;
  iat: number;
  expires: number | null;
};
