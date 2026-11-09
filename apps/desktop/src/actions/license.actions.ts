import { getLicenseRepo } from "../repos";
import { produceAppState } from "../store";
import { getLogger } from "../utils/log.utils";

export const loadLicense = async (): Promise<void> => {
  try {
    const license = await getLicenseRepo().getLicense();
    produceAppState((draft) => {
      draft.license = license;
    });
  } catch (error) {
    getLogger().error(`Failed to load license: ${error}`);
  }
};

export const activateLicense = async (token: string): Promise<void> => {
  const license = await getLicenseRepo().activateLicense(token.trim());
  produceAppState((draft) => {
    draft.license = license;
  });
};

export const deactivateLicense = async (): Promise<void> => {
  await getLicenseRepo().clearLicense();
  produceAppState((draft) => {
    draft.license = null;
  });
};
