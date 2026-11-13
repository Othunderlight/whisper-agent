import { Nullable } from "@ryoiki-tenkai/types";
import { getIsDevMode } from "../utils/env.utils";

export type OnboardingPageKey =
  | "chooseTranscription"
  | "chooseLlm"
  | "userDetails"
  | "referralSource"
  | "micPerms"
  | "a11yPerms"
  | "keybindings"
  | "micCheck"
  | "tutorial";

export type OnboardingState = {
  name: string;
  title: string;
  currentPage: OnboardingPageKey;
  history: OnboardingPageKey[];
  submitting: boolean;
  tryItOutInput: string;
  preferredMicrophone: Nullable<string>;
  company: string;
  isMac: boolean;
  referralSource: string;
  dictationOverrideEnabled: boolean;
};

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  name: "",
  title: "",
  currentPage: "chooseTranscription",
  history: [],
  submitting: false,
  tryItOutInput: "",
  preferredMicrophone: null,
  company: "",
  isMac: false,
  referralSource: "",
  dictationOverrideEnabled: false,
};

if (getIsDevMode()) {
  INITIAL_ONBOARDING_STATE.name = "Emulator User";
}
