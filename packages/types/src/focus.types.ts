export type FocusStatus = "focused" | "distracted" | "neutral" | "error";

export type FocusCheck = {
  id: string;
  createdAt: string;
  screenshotPath: string;
  status: FocusStatus;
  distractionScore: number;
  focusedProbability: number;
  distractedProbability: number;
  neutralProbability: number;
  confidence: number;
  error?: string | null;
};

export type FocusSettings = {
  enabled: boolean;
  accountId: string;
  tokenSuffix?: string | null;
  tokenFull?: string | null;
  taskDescription: string;
  questionsJson: string;
  intervalMinutes: number;
  cleanHistoryDaily: boolean;
  notifyWhenFocused: boolean;
};

/** Payload sent to save focus settings. The token is only transmitted when the
 * user changes it; omitting it keeps the stored token untouched. */
export type FocusSettingsSaveInput = {
  enabled: boolean;
  accountId: string;
  token?: string | null;
  taskDescription: string;
  questionsJson: string;
  intervalMinutes: number;
  cleanHistoryDaily: boolean;
  notifyWhenFocused: boolean;
};
