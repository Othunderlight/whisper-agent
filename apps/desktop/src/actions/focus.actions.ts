import { ActiveDashboard } from "../state/local.state";
import { FocusCheck, FocusSettings } from "@voquill/types";
import dayjs from "dayjs";
import { getFocusRepo } from "../repos";
import { getAppState, produceAppState } from "../store";
import {
  DEFAULT_FOCUS_TASK_DESCRIPTION,
  getDefaultFocusQuestionsJson,
  isCheckDistracted,
} from "../utils/focus.utils";
import { createId } from "../utils/id.utils";

const normalizeFocusSettings = (settings: FocusSettings): FocusSettings => ({
  ...settings,
  taskDescription: settings.taskDescription || DEFAULT_FOCUS_TASK_DESCRIPTION,
  questionsJson:
    settings.questionsJson?.trim() || getDefaultFocusQuestionsJson(),
});

export const setActiveDashboard = (dashboard: ActiveDashboard): void => {
  produceAppState((draft) => {
    draft.local.activeDashboard = dashboard;
  });
};

export const loadFocusSettings = async (): Promise<void> => {
  const status = getAppState().focus.settingsStatus;
  if (status === "loading" || status === "success") return;

  produceAppState((draft) => {
    draft.focus.settingsStatus = "loading";
  });

  try {
    const settings = await getFocusRepo().getSettings();
    produceAppState((draft) => {
      draft.focus.settings = normalizeFocusSettings(settings);
      draft.focus.settingsStatus = "success";
    });
  } catch (error) {
    produceAppState((draft) => {
      draft.focus.settingsStatus = "error";
    });
    console.error("Failed to load focus settings", error);
  }
};

export const saveFocusSettings = async (settings: FocusSettings) => {
  produceAppState((draft) => {
    draft.focus.settingsStatus = "loading";
  });

  try {
    const saved = await getFocusRepo().saveSettings(settings);
    produceAppState((draft) => {
      draft.focus.settings = normalizeFocusSettings(saved);
      draft.focus.settingsStatus = "success";
    });
  } catch (error) {
    produceAppState((draft) => {
      draft.focus.settingsStatus = "error";
    });
    console.error("Failed to save focus settings", error);
    throw error;
  }
};

export const loadFocusChecks = async (): Promise<void> => {
  produceAppState((draft) => {
    draft.focus.status = "loading";
  });

  try {
    const checks = await getFocusRepo().listChecks({ limit: 200 });
    produceAppState((draft) => {
      draft.focusCheckById = Object.fromEntries(
        checks.map((check) => [check.id, check]),
      );
      draft.focus.checkIds = checks.map((check) => check.id);
      draft.focus.status = "success";
    });
  } catch (error) {
    produceAppState((draft) => {
      draft.focus.status = "error";
    });
    console.error("Failed to load focus checks", error);
  }
};

/** Runs a single screenshot → CLEF → persist → notify cycle. Guarded against
 * concurrent runs and no-ops unless focus detection is enabled and configured. */
export const runFocusCheck = async (): Promise<void> => {
  const { settings, isChecking } = getAppState().focus;
  if (!settings?.enabled || isChecking) return;
  if (!settings.accountId || !settings.tokenFull) return;

  produceAppState((draft) => {
    draft.focus.isChecking = true;
  });

  try {
    const repo = getFocusRepo();
    const screenshot = await repo.captureScreenshot();

    const verdict = await repo.analyzeScreenshot({
      accountId: settings.accountId,
      token: settings.tokenFull,
      taskDescription: settings.taskDescription,
      questionsJson: settings.questionsJson,
      dataUri: screenshot.dataUri,
    });

    const draftCheck: FocusCheck = {
      id: createId(),
      createdAt: dayjs().toISOString(),
      screenshotPath: screenshot.path,
      ...verdict,
    };

    const created = await repo.createCheck(draftCheck);

    produceAppState((draft) => {
      draft.focusCheckById[created.id] = created;
      draft.focus.checkIds = [created.id, ...draft.focus.checkIds];
    });

    if (isCheckDistracted(created)) {
      await repo.sendNotification(
        "Stay on task",
        "You're drifting from your focus goal. Time to refocus!",
      );
    } else if (settings.notifyWhenFocused && created.status === "focused") {
      await repo.sendNotification(
        "Nice focus",
        "You're right on task. Keep going!",
      );
    }
  } catch (error) {
    console.error("Focus check failed", error);
  } finally {
    produceAppState((draft) => {
      draft.focus.isChecking = false;
    });
  }
};

/** Purges checks (and their screenshots) from previous days, at most once per
 * day, when the user has daily cleanup enabled. */
export const cleanupFocusHistory = async (): Promise<void> => {
  const { settings, lastCleanupAt } = getAppState().focus;
  if (!settings?.cleanHistoryDaily) return;

  const startOfToday = dayjs().startOf("day").valueOf();
  if (lastCleanupAt && lastCleanupAt >= startOfToday) return;

  try {
    await getFocusRepo().deleteChecksBefore(startOfToday);
    produceAppState((draft) => {
      draft.focus.lastCleanupAt = Date.now();
    });
    await loadFocusChecks();
  } catch (error) {
    console.error("Failed to clean up focus history", error);
  }
};
