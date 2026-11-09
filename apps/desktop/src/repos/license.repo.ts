import { invoke } from "@tauri-apps/api/core";
import type { LicensePayload } from "../types/license.types";
import { BaseRepo } from "./base.repo";

export abstract class BaseLicenseRepo extends BaseRepo {
  abstract getLicense(): Promise<LicensePayload | null>;
  abstract activateLicense(token: string): Promise<LicensePayload>;
  abstract clearLicense(): Promise<void>;
}

export class LocalLicenseRepo extends BaseLicenseRepo {
  async getLicense(): Promise<LicensePayload | null> {
    return invoke<LicensePayload | null>("license_get");
  }

  async activateLicense(token: string): Promise<LicensePayload> {
    return invoke<LicensePayload>("license_activate", { token });
  }

  async clearLicense(): Promise<void> {
    await invoke<void>("license_clear");
  }
}
