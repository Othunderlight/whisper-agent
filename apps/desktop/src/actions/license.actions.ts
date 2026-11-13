import { getApiKeyRepo, getLicenseRepo } from "../repos";
import { produceAppState } from "../store";
import type { LicensePayload } from "../types/license.types";
import { registerApiKeys } from "../utils/app.utils";
import { getLogger } from "../utils/log.utils";
import { updateUserPreferences } from "./user.actions";

const PRESET_APPLIED_KEY = "ryoiki-tenkai:license-preset-applied";

const getAppliedLicenseId = (): string | null => {
  try {
    return window.localStorage.getItem(PRESET_APPLIED_KEY);
  } catch {
    return null;
  }
};

const markPresetApplied = (licenseId: string): void => {
  try {
    window.localStorage.setItem(PRESET_APPLIED_KEY, licenseId);
  } catch {
    // Applying again on the next launch is harmless.
  }
};

const clearPresetApplied = (): void => {
  try {
    window.localStorage.removeItem(PRESET_APPLIED_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const prepareOnboardingForLicense = (license: LicensePayload): void => {
  if (license.tier !== "pro") {
    return;
  }

  produceAppState((draft) => {
    if (
      draft.onboarding.history.length === 0 &&
      draft.onboarding.currentPage === "chooseTranscription"
    ) {
      draft.onboarding.currentPage = "userDetails";
    }
  });
};

const applyLicensePreset = async (
  license: LicensePayload,
): Promise<boolean> => {
  const preset = license.provider;
  if (license.tier !== "pro" || !preset || preset.provider !== "groq") {
    return true;
  }

  try {
    const appliedLicenseId = getAppliedLicenseId();
    const apiKeyId = `license-${license.id}`;
    const repo = getApiKeyRepo();
    const existingKeys = await repo.listApiKeys();
    const existing = existingKeys.find((apiKey) => apiKey.id === apiKeyId);

    if (appliedLicenseId === license.id && existing) {
      return true;
    }

    if (existing) {
      await repo.updateApiKey({
        id: apiKeyId,
        name: `Groq (${license.email})`,
        key: preset.apiKey,
        transcriptionModel: preset.model,
      });
    } else {
      await repo.createApiKey({
        id: apiKeyId,
        name: `Groq (${license.email})`,
        provider: "groq",
        key: preset.apiKey,
      });
      await repo.updateApiKey({
        id: apiKeyId,
        transcriptionModel: preset.model,
      });
    }

    const apiKeys = await repo.listApiKeys();
    produceAppState((draft) => {
      registerApiKeys(draft, apiKeys);
      draft.settings.apiKeys = apiKeys;
      draft.settings.apiKeysStatus = "success";
      draft.local.assistantModeEnabled = false;
      draft.local.activeDashboard = "transcription";
    });

    await updateUserPreferences((preferences) => {
      preferences.transcriptionMode = "api";
      preferences.transcriptionApiKeyId = apiKeyId;
      preferences.transcriptionDevice = null;
      preferences.transcriptionModelSize = null;
      preferences.postProcessingMode = "none";
      preferences.postProcessingApiKeyId = null;
      preferences.agentMode = "none";
      preferences.agentModeApiKeyId = null;
      preferences.openclawGatewayUrl = null;
      preferences.openclawToken = null;
    });

    markPresetApplied(license.id);
    return true;
  } catch (error) {
    getLogger().error(`Failed to apply license provider preset: ${error}`);
    return false;
  }
};

export const openLicenseDialog = (): void => {
  produceAppState((draft) => {
    draft.settings.licenseDialogOpen = true;
  });
};

export const loadLicense = async (): Promise<void> => {
  try {
    const license = await getLicenseRepo().getLicense();

    if (license) {
      await applyLicensePreset(license);
      prepareOnboardingForLicense(license);
    }

    produceAppState((draft) => {
      draft.license = license;
    });
  } catch (error) {
    getLogger().error(`Failed to load license: ${error}`);
  }
};

export const activateLicense = async (token: string): Promise<void> => {
  const license = await getLicenseRepo().activateLicense(token);

  const applied = await applyLicensePreset(license);
  if (!applied) {
    await getLicenseRepo().clearLicense();
    clearPresetApplied();
    throw new Error("Unable to apply the Pro configuration. Please try again.");
  }

  prepareOnboardingForLicense(license);
  produceAppState((draft) => {
    draft.license = license;
  });
};

export const deactivateLicense = async (): Promise<void> => {
  await getLicenseRepo().clearLicense();
  produceAppState((draft) => {
    draft.license = null;
  });
  clearPresetApplied();
};
