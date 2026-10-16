import { FocusCheck, FocusStatus } from "@voquill/types";

/** A distraction score above this (on CLEF's 0–2 scale) triggers a warning
 * notification, matching the value used in the reference CLEF script. */
export const DISTRACTION_ALERT_THRESHOLD = 1.5;

export const MIN_FOCUS_INTERVAL_MINUTES = 2;
export const DEFAULT_FOCUS_INTERVAL_MINUTES = 10;

export const DEFAULT_FOCUS_TASK_DESCRIPTION =
  "The user must ONLY work on Healthcare AI (medical code, health datasets, research papers). Social media, YouTube, news, and unrelated AI projects are considered off-task.";

export const DEFAULT_FOCUS_QUESTIONS = {
  focus_status: {
    type: "choice",
    instructions: "Is the user on-task or distracted based on the screenshot?",
    criteria: {
      focused:
        "Healthcare AI code, medical datasets, papers, or documentation.",
      distracted:
        "Reddit, Twitter/X, random AI news/demos, YouTube, or gaming.",
      neutral:
        "Desktop, blank browser tab, terminal without clear context, or system settings.",
    },
  },
  distraction_score: {
    type: "score",
    instructions: "Rate how unrelated the screen is to Healthcare AI work.",
    criteria: [
      "Directly relevant to Healthcare AI",
      "Somewhat related / general work",
      "Completely off-task / rabbit hole",
    ],
  },
};

export const getDefaultFocusQuestionsJson = (): string =>
  JSON.stringify(DEFAULT_FOCUS_QUESTIONS, null, 2);

export const isCheckDistracted = (
  check: Pick<FocusCheck, "status" | "distractionScore">,
): boolean =>
  check.status === "distracted" ||
  check.distractionScore > DISTRACTION_ALERT_THRESHOLD;

export const focusStatusColor = (status: FocusStatus): string => {
  switch (status) {
    case "focused":
      return "success.main";
    case "distracted":
      return "error.main";
    case "neutral":
      return "warning.main";
    default:
      return "text.secondary";
  }
};
