import {
  Button,
  Divider,
  FormControlLabel,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FocusSettings } from "@voquill/types";
import {
  loadFocusSettings,
  saveFocusSettings,
} from "../../actions/focus.actions";
import { showErrorSnackbar, showSnackbar } from "../../actions/app.actions";
import { useAsyncEffect } from "../../hooks/async.hooks";
import { useAppStore } from "../../store";
import {
  DEFAULT_FOCUS_INTERVAL_MINUTES,
  MIN_FOCUS_INTERVAL_MINUTES,
} from "../../utils/focus.utils";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";

type FormState = {
  enabled: boolean;
  accountId: string;
  token: string;
  taskDescription: string;
  questionsJson: string;
  intervalMinutes: number;
  cleanHistoryDaily: boolean;
  notifyWhenFocused: boolean;
};

const toForm = (settings: FocusSettings): FormState => ({
  enabled: settings.enabled,
  accountId: settings.accountId,
  token: "",
  taskDescription: settings.taskDescription,
  questionsJson: settings.questionsJson,
  intervalMinutes: settings.intervalMinutes || DEFAULT_FOCUS_INTERVAL_MINUTES,
  cleanHistoryDaily: settings.cleanHistoryDaily,
  notifyWhenFocused: settings.notifyWhenFocused,
});

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
    {children}
  </Typography>
);

export default function FocusSettingsPage() {
  const intl = useIntl();
  const settings = useAppStore((state) => state.focus.settings);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useAsyncEffect(async () => {
    await loadFocusSettings();
  }, []);

  useEffect(() => {
    if (settings && !form) {
      setForm(toForm(settings));
    }
  }, [settings, form]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const handleSave = async () => {
    if (!settings || !form) return;
    setSaving(true);
    try {
      const payload: FocusSettings = {
        ...settings,
        enabled: form.enabled,
        accountId: form.accountId.trim(),
        tokenFull: form.token.trim() ? form.token.trim() : settings.tokenFull,
        taskDescription: form.taskDescription,
        questionsJson: form.questionsJson,
        intervalMinutes: Math.max(
          MIN_FOCUS_INTERVAL_MINUTES,
          Math.trunc(form.intervalMinutes),
        ),
        cleanHistoryDaily: form.cleanHistoryDaily,
        notifyWhenFocused: form.notifyWhenFocused,
      };
      await saveFocusSettings(payload);
      showSnackbar(
        intl.formatMessage({ defaultMessage: "Focus settings saved." }),
      );
      setForm((current) => (current ? { ...current, token: "" } : current));
    } catch (error) {
      showErrorSnackbar(error);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <DashboardEntryLayout>
        <Typography color="text.secondary">
          <FormattedMessage defaultMessage="Loading…" />
        </Typography>
      </DashboardEntryLayout>
    );
  }

  const configured = Boolean(settings?.accountId && settings?.tokenFull);

  return (
    <DashboardEntryLayout>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        <FormattedMessage defaultMessage="Focus Detection" />
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <FormattedMessage defaultMessage="Periodically screenshot your screen and let an AI vision model tell you when you drift from your focus goal." />
      </Typography>

      <SectionHeader>
        <FormattedMessage defaultMessage="Status" />
      </SectionHeader>
      <FormControlLabel
        control={
          <Switch
            checked={form.enabled}
            onChange={(event) => set("enabled", event.target.checked)}
          />
        }
        label={<FormattedMessage defaultMessage="Enable focus detection" />}
      />
      {!configured ? (
        <Typography variant="caption" color="warning.main">
          <FormattedMessage defaultMessage="Add your Cloudflare account ID and API token below to start monitoring." />
        </Typography>
      ) : null}

      <Divider sx={{ my: 2 }} />

      <SectionHeader>
        <FormattedMessage defaultMessage="Cloudflare" />
      </SectionHeader>
      <TextField
        fullWidth
        size="small"
        label={<FormattedMessage defaultMessage="Account ID" />}
        value={form.accountId}
        onChange={(event) => set("accountId", event.target.value)}
        sx={{ mb: 1.5 }}
      />
      <TextField
        fullWidth
        size="small"
        type="password"
        label={<FormattedMessage defaultMessage="API Token" />}
        value={form.token}
        placeholder={
          settings?.tokenSuffix
            ? intl.formatMessage(
                { defaultMessage: "Saved (••••{suffix})" },
                { suffix: settings.tokenSuffix },
              )
            : ""
        }
        onChange={(event) => set("token", event.target.value)}
        helperText={
          <FormattedMessage defaultMessage="Leave blank to keep your saved token." />
        }
      />

      <Divider sx={{ my: 2 }} />

      <SectionHeader>
        <FormattedMessage defaultMessage="Focus Goal" />
      </SectionHeader>
      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label={
          <FormattedMessage defaultMessage="What you should be working on" />
        }
        value={form.taskDescription}
        onChange={(event) => set("taskDescription", event.target.value)}
      />

      <Divider sx={{ my: 2 }} />

      <SectionHeader>
        <FormattedMessage defaultMessage="Schedule" />
      </SectionHeader>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        <FormattedMessage
          defaultMessage="Screenshot every {minutes} {minutes, plural, one {minute} other {minutes}}"
          values={{ minutes: form.intervalMinutes }}
        />
      </Typography>
      <Slider
        min={MIN_FOCUS_INTERVAL_MINUTES}
        max={60}
        step={1}
        value={form.intervalMinutes}
        onChange={(_, value) => set("intervalMinutes", value as number)}
        valueLabelDisplay="auto"
        sx={{ mb: 1 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.cleanHistoryDaily}
            onChange={(event) => set("cleanHistoryDaily", event.target.checked)}
          />
        }
        label={<FormattedMessage defaultMessage="Clear history every day" />}
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.notifyWhenFocused}
            onChange={(event) => set("notifyWhenFocused", event.target.checked)}
          />
        }
        label={
          <FormattedMessage defaultMessage="Also notify when I stay focused" />
        }
      />

      <Divider sx={{ my: 2 }} />

      <SectionHeader>
        <FormattedMessage defaultMessage="Advanced" />
      </SectionHeader>
      <TextField
        fullWidth
        multiline
        minRows={6}
        size="small"
        label={<FormattedMessage defaultMessage="Model questions (JSON)" />}
        value={form.questionsJson}
        onChange={(event) => set("questionsJson", event.target.value)}
        slotProps={{
          htmlInput: { sx: { fontFamily: "monospace", fontSize: 12 } },
        }}
        helperText={
          <FormattedMessage defaultMessage="Expected answers: a focus_status choice and a distraction_score score." />
        }
      />

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        sx={{ mt: 3, alignSelf: "flex-start" }}
      >
        {saving ? (
          <FormattedMessage defaultMessage="Saving…" />
        ) : (
          <FormattedMessage defaultMessage="Save" />
        )}
      </Button>
    </DashboardEntryLayout>
  );
}
