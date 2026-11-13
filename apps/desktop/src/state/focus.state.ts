import { FocusSettings } from "@ryoiki-tenkai/types";
import { ActionStatus } from "../types/state.types";

export type FocusState = {
  checkIds: string[];
  status: ActionStatus;
  settings: FocusSettings | null;
  settingsStatus: ActionStatus;
  isChecking: boolean;
  lastCleanupAt: number | null;
};

export const INITIAL_FOCUS_STATE: FocusState = {
  checkIds: [],
  status: "idle",
  settings: null,
  settingsStatus: "idle",
  isChecking: false,
  lastCleanupAt: null,
};
