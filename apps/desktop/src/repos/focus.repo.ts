import { FocusCheck, FocusSettings, FocusStatus } from "@ryoiki-tenkai/types";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { BaseRepo } from "./base.repo";

const CLEF_MODEL_URL =
  "https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/@cf/cloudflare/clef";

// Shape returned by the Rust commands (camelCase via serde).
type LocalFocusCheck = {
  id: string;
  createdAt: number;
  screenshotPath: string;
  status: string;
  distractionScore: number;
  focusedProbability: number;
  distractedProbability: number;
  neutralProbability: number;
  confidence: number;
  error?: string | null;
};

// Matches the Rust FocusCheckCreateArgs (backend assigns createdAt).
type LocalFocusCheckCreateArgs = Omit<LocalFocusCheck, "createdAt">;

type LocalFocusScreenshot = {
  path: string;
  dataUri: string;
};

type LocalFocusSettings = {
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

export type FocusScreenshot = {
  path: string;
  dataUri: string;
};

export type ClefVerdict = {
  status: FocusStatus;
  distractionScore: number;
  focusedProbability: number;
  distractedProbability: number;
  neutralProbability: number;
  confidence: number;
};

export type AnalyzeScreenshotParams = {
  accountId: string;
  token: string;
  taskDescription: string;
  questionsJson: string;
  dataUri: string;
};

export type ListFocusChecksParams = {
  limit?: number;
  offset?: number;
};

type ClefAnswer = {
  choice?: string;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type ClefResponse = {
  result?: { answers?: Record<string, ClefAnswer> };
  success?: boolean;
};

const fromLocalFocusCheck = (check: LocalFocusCheck): FocusCheck => ({
  id: check.id,
  createdAt: new Date(check.createdAt).toISOString(),
  screenshotPath: check.screenshotPath,
  status: normalizeFocusStatus(check.status),
  distractionScore: check.distractionScore,
  focusedProbability: check.focusedProbability,
  distractedProbability: check.distractedProbability,
  neutralProbability: check.neutralProbability,
  confidence: check.confidence,
  error: check.error ?? null,
});

const normalizeFocusStatus = (status: string): FocusStatus =>
  status === "focused" || status === "distracted" || status === "neutral"
    ? status
    : "error";

const toLocalFocusCheckArgs = (
  check: FocusCheck,
): LocalFocusCheckCreateArgs => ({
  id: check.id,
  screenshotPath: check.screenshotPath,
  status: check.status,
  distractionScore: check.distractionScore,
  focusedProbability: check.focusedProbability,
  distractedProbability: check.distractedProbability,
  neutralProbability: check.neutralProbability,
  confidence: check.confidence,
  error: check.error ?? null,
});

const fromLocalFocusSettings = (
  settings: LocalFocusSettings,
): FocusSettings => ({
  enabled: settings.enabled,
  accountId: settings.accountId,
  tokenSuffix: settings.tokenSuffix ?? null,
  tokenFull: settings.tokenFull ?? null,
  taskDescription: settings.taskDescription,
  questionsJson: settings.questionsJson,
  intervalMinutes: settings.intervalMinutes,
  cleanHistoryDaily: settings.cleanHistoryDaily,
  notifyWhenFocused: settings.notifyWhenFocused,
});

const parseClefAnswers = (answers: Record<string, ClefAnswer>): ClefVerdict => {
  const statusAnswer = answers.focus_status;
  const scoreAnswer = answers.distraction_score;
  const probabilities = statusAnswer?.probabilities ?? {};

  return {
    status: normalizeFocusStatus(statusAnswer?.choice ?? ""),
    distractionScore: scoreAnswer?.score ?? 0,
    focusedProbability: probabilities.focused ?? 0,
    distractedProbability: probabilities.distracted ?? 0,
    neutralProbability: probabilities.neutral ?? 0,
    confidence: statusAnswer?.confidence ?? 0,
  };
};

export abstract class BaseFocusRepo extends BaseRepo {
  abstract captureScreenshot(): Promise<FocusScreenshot>;
  abstract analyzeScreenshot(
    params: AnalyzeScreenshotParams,
  ): Promise<ClefVerdict>;
  abstract createCheck(check: FocusCheck): Promise<FocusCheck>;
  abstract listChecks(params?: ListFocusChecksParams): Promise<FocusCheck[]>;
  abstract deleteChecksBefore(beforeTimestamp: number): Promise<string[]>;
  abstract getSettings(): Promise<FocusSettings>;
  abstract saveSettings(settings: FocusSettings): Promise<FocusSettings>;
  abstract sendNotification(title: string, body: string): Promise<void>;
}

export class LocalFocusRepo extends BaseFocusRepo {
  async captureScreenshot(): Promise<FocusScreenshot> {
    const screenshot = await invoke<LocalFocusScreenshot>(
      "focus_capture_screenshot",
    );
    return { path: screenshot.path, dataUri: screenshot.dataUri };
  }

  async analyzeScreenshot({
    accountId,
    token,
    taskDescription,
    questionsJson,
    dataUri,
  }: AnalyzeScreenshotParams): Promise<ClefVerdict> {
    const url = CLEF_MODEL_URL.replace("{accountId}", accountId);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "clef",
        state: taskDescription,
        images: [dataUri],
        questions: JSON.parse(questionsJson),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `CLEF request failed (${response.status})${detail ? `: ${detail}` : ""}`,
      );
    }

    const payload = (await response.json()) as ClefResponse;
    if (payload.success === false) {
      throw new Error("CLEF request reported failure.");
    }

    return parseClefAnswers(payload.result?.answers ?? {});
  }

  async createCheck(check: FocusCheck): Promise<FocusCheck> {
    const stored = await invoke<LocalFocusCheck>("focus_check_create", {
      args: toLocalFocusCheckArgs(check),
    });
    return fromLocalFocusCheck(stored);
  }

  async listChecks(params: ListFocusChecksParams = {}): Promise<FocusCheck[]> {
    const limit = Math.max(0, Math.trunc(params.limit ?? 200));
    const offset = Math.max(0, Math.trunc(params.offset ?? 0));
    const checks = await invoke<LocalFocusCheck[]>("focus_check_list", {
      limit,
      offset,
    });
    return checks.map(fromLocalFocusCheck);
  }

  async deleteChecksBefore(beforeTimestamp: number): Promise<string[]> {
    const paths = await invoke<string[]>("focus_check_delete_old", {
      beforeTimestamp,
    });
    return Array.isArray(paths) ? paths : [];
  }

  async getSettings(): Promise<FocusSettings> {
    const settings = await invoke<LocalFocusSettings>("focus_settings_get");
    return fromLocalFocusSettings(settings);
  }

  async saveSettings(settings: FocusSettings): Promise<FocusSettings> {
    const saved = await invoke<LocalFocusSettings>("focus_settings_set", {
      request: {
        enabled: settings.enabled,
        accountId: settings.accountId,
        token: settings.tokenFull ?? null,
        taskDescription: settings.taskDescription,
        questionsJson: settings.questionsJson,
        intervalMinutes: settings.intervalMinutes,
        cleanHistoryDaily: settings.cleanHistoryDaily,
        notifyWhenFocused: settings.notifyWhenFocused,
      },
    });
    return fromLocalFocusSettings(saved);
  }

  async sendNotification(title: string, body: string): Promise<void> {
    await invoke<void>("focus_send_notification", { title, body });
  }
}
