export type LocalState = {
  assistantModeEnabled: boolean;
  assistantAutoSilenceEnabled: boolean;
  powerModeEnabled: boolean;
  lastDictationReminderShownAt: number | null;
  lastDictatedAt: number | null;
  lastSeenTrialExtensionClaimedAt: string | null;
  featureSeenAt: string | null;
  disablePillRewards: boolean;
  accurateDictationEnabled?: boolean;
  hasHiddenTrialExtensionCard: boolean;
  disableAutoStyleLoading?: boolean;
  lastAuthCheckAt: string | null;
};

export const INITIAL_LOCAL_STATE: LocalState = {
  assistantModeEnabled: false,
  assistantAutoSilenceEnabled: true,
  powerModeEnabled: false,
  lastDictationReminderShownAt: null,
  lastDictatedAt: null,
  lastSeenTrialExtensionClaimedAt: null,
  featureSeenAt: null,
  disablePillRewards: false,
  accurateDictationEnabled: false,
  hasHiddenTrialExtensionCard: false,
  disableAutoStyleLoading: false,
  lastAuthCheckAt: null,
};
