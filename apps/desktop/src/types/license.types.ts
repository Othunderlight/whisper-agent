export type LicenseTier = "normal" | "pro";

export type LicenseProviderPreset = {
  provider: string;
  apiKey: string;
  model: string;
};

export type LicensePayload = {
  v: number;
  product: string;
  id: string;
  email: string;
  tier: LicenseTier;
  iat: number;
  expires: number | null;
  provider: LicenseProviderPreset | null;
};
