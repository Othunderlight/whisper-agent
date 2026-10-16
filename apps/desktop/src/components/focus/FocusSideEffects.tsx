import {
  cleanupFocusHistory,
  loadFocusChecks,
  loadFocusSettings,
  runFocusCheck,
} from "../../actions/focus.actions";
import { useAsyncEffect } from "../../hooks/async.hooks";
import { useIntervalAsync } from "../../hooks/helper.hooks";
import { useAppStore } from "../../store";
import {
  DEFAULT_FOCUS_INTERVAL_MINUTES,
  MIN_FOCUS_INTERVAL_MINUTES,
} from "../../utils/focus.utils";
import {
  hoursToMilliseconds,
  minutesToMilliseconds,
} from "../../utils/time.utils";

/** Drives the focus-detection loop: loads settings/history once, then runs a
 * screenshot→CLEF check on the configured interval and purges old history. */
export const FocusSideEffects = () => {
  const enabled = useAppStore(
    (state) => state.focus.settings?.enabled ?? false,
  );
  const intervalMinutes = useAppStore(
    (state) =>
      state.focus.settings?.intervalMinutes ?? DEFAULT_FOCUS_INTERVAL_MINUTES,
  );
  const cleanHistoryDaily = useAppStore(
    (state) => state.focus.settings?.cleanHistoryDaily ?? true,
  );

  useAsyncEffect(async () => {
    await loadFocusSettings();
    await loadFocusChecks();
  }, []);

  useIntervalAsync(
    minutesToMilliseconds(
      Math.max(MIN_FOCUS_INTERVAL_MINUTES, intervalMinutes),
    ),
    async () => {
      await runFocusCheck();
    },
    [enabled, intervalMinutes],
  );

  useIntervalAsync(
    hoursToMilliseconds(1),
    async () => {
      await cleanupFocusHistory();
    },
    [cleanHistoryDaily],
  );

  return null;
};
