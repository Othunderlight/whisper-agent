import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { invoke } from "@tauri-apps/api/core";
import type {
  WakewordConfig,
  WakewordModelInfo,
} from "../types/wakeword.types";
import { produceAppState, getAppState } from "../store";
import { showErrorSnackbar } from "./app.actions";

const isTauriEnvironment = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const tauriWindow = window as typeof window & Record<string, unknown>;
  return (
    "__TAURI_INTERNALS__" in tauriWindow ||
    "__TAURI__" in tauriWindow ||
    "__TAURI_IPC__" in tauriWindow
  );
};

export const syncAutoLaunchSetting = async (): Promise<void> => {
  if (!isTauriEnvironment()) {
    produceAppState((draft) => {
      draft.settings.autoLaunchStatus = "success";
      draft.settings.autoLaunchEnabled = false;
    });
    return;
  }

  produceAppState((draft) => {
    draft.settings.autoLaunchStatus = "loading";
  });

  try {
    const enabled = await isEnabled();
    produceAppState((draft) => {
      draft.settings.autoLaunchEnabled = enabled;
      draft.settings.autoLaunchStatus = "success";
    });
  } catch (error) {
    console.error("Failed to determine auto-start status", error);
    produceAppState((draft) => {
      draft.settings.autoLaunchStatus = "error";
    });
  }
};

export const setAutoLaunchEnabled = async (enabled: boolean): Promise<void> => {
  if (!isTauriEnvironment()) {
    produceAppState((draft) => {
      draft.settings.autoLaunchEnabled = enabled;
      draft.settings.autoLaunchStatus = "success";
    });
    return;
  }

  const state = getAppState();
  if (state.settings.autoLaunchStatus === "loading") {
    return;
  }

  const previous = state.settings.autoLaunchEnabled;

  produceAppState((draft) => {
    draft.settings.autoLaunchEnabled = enabled;
    draft.settings.autoLaunchStatus = "loading";
  });

  try {
    if (enabled) {
      await enable();
    } else {
      await disable();
    }

    produceAppState((draft) => {
      draft.settings.autoLaunchStatus = "success";
    });
  } catch (error) {
    console.error("Failed to update auto-start preference", error);
    produceAppState((draft) => {
      draft.settings.autoLaunchEnabled = previous;
      draft.settings.autoLaunchStatus = "error";
    });
    showErrorSnackbar(
      "Unable to update auto start preference. Please try again.",
    );
  }
};

export const listWakewordModels = async (): Promise<WakewordModelInfo[]> =>
  invoke<WakewordModelInfo[]>("list_wakeword_models");

export const getWakewordConfig = async (): Promise<WakewordConfig> =>
  invoke<WakewordConfig>("get_wakeword_config");

export const setWakewordConfig = async (
  config: WakewordConfig,
): Promise<void> => invoke<void>("set_wakeword_config", { config });

export const importWakewordModel = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return invoke<string>("import_wakeword_model", { name: file.name, bytes });
};
