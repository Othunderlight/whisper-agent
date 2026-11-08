import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { ChangeEvent, useState } from "react";
import { FormattedMessage } from "react-intl";
import { produceAppState, useAppStore } from "../../store";
import {
  getIsAssistantAutoSilenceEnabled,
  getIsAssistantModeEnabled,
  getIsPowerModeEnabled,
} from "../../utils/assistant-mode.utils";
import { AGENT_DICTATE_HOTKEY } from "../../utils/keyboard.utils";
import { AIAgentModeConfiguration } from "../settings/AIAgentModeConfiguration";
import { HotkeySetting } from "../settings/HotkeySetting";

const SettingsRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="flex-start"
    spacing={2}
    sx={{ width: "100%" }}
  >
    <Stack spacing={0.5} flex={1}>
      <Typography variant="body1" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Stack>
    <Switch checked={checked} onChange={onChange} />
  </Stack>
);

export const AssistantSettings = () => {
  const assistantModeEnabled = useAppStore(getIsAssistantModeEnabled);
  const autoSilenceEnabled = useAppStore(getIsAssistantAutoSilenceEnabled);
  const powerModeEnabled = useAppStore(getIsPowerModeEnabled);
  const [powerModeWarningOpen, setPowerModeWarningOpen] = useState(false);

  const handleAssistantModeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.local.assistantModeEnabled = event.target.checked;
    });
  };

  const handleAutoSilenceToggle = (event: ChangeEvent<HTMLInputElement>) => {
    produceAppState((draft) => {
      draft.local.assistantAutoSilenceEnabled = event.target.checked;
    });
  };

  const handlePowerModeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setPowerModeWarningOpen(true);
    } else {
      produceAppState((draft) => {
        draft.local.powerModeEnabled = false;
      });
    }
  };

  const handleConfirmPowerMode = () => {
    produceAppState((draft) => {
      draft.local.powerModeEnabled = true;
    });
    setPowerModeWarningOpen(false);
  };

  return (
    <>
      <Dialog
        open={powerModeWarningOpen}
        onClose={() => setPowerModeWarningOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberRoundedIcon color="warning" />
          <FormattedMessage defaultMessage="Enable power mode?" />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            <FormattedMessage defaultMessage="Power mode allows the assistant to run terminal commands on your computer. This is powerful but inherently dangerous — commands run with your full user permissions and can modify files, install software, or access sensitive data." />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            <FormattedMessage defaultMessage="This feature is very experimental. Only enable this if you know what you're doing. You will still be asked to approve each command before it runs." />
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, fontWeight: 600 }}
          >
            <FormattedMessage defaultMessage="By enabling power mode, you accept full responsibility for any actions taken by the assistant. Ryōiki Tenkai is not liable for any consequences resulting from commands executed on your system." />
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPowerModeWarningOpen(false)}>
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
          <Button
            onClick={handleConfirmPowerMode}
            color="warning"
            variant="contained"
          >
            <FormattedMessage defaultMessage="I understand, enable power mode" />
          </Button>
        </DialogActions>
      </Dialog>

      <Stack spacing={3} alignItems="flex-start" sx={{ pb: 8 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={700}>
            <FormattedMessage defaultMessage="Assistant mode" />
          </Typography>
          <Chip label="Beta" size="small" color="primary" />
        </Stack>
        <Typography variant="body1" color="text.secondary">
          <FormattedMessage defaultMessage="Assistant mode follows commands you dictate instead of just cleaning up text." />
        </Typography>

        <AIAgentModeConfiguration />
        <Divider flexItem />

        <HotkeySetting
          title={<FormattedMessage defaultMessage="Assistant hotkey" />}
          description={
            <FormattedMessage defaultMessage="Press this key combination to start assistant mode." />
          }
          actionName={AGENT_DICTATE_HOTKEY}
        />

        <Divider flexItem />

        <SettingsRow
          title={<FormattedMessage defaultMessage="Enable assistant mode" />}
          description={
            <FormattedMessage defaultMessage="Assistant mode is disabled by default. This is a new feature — if you have any feedback, please stop by our Discord channel" />
          }
          checked={assistantModeEnabled}
          onChange={handleAssistantModeToggle}
        />

        <SettingsRow
          title={<FormattedMessage defaultMessage="Auto-silence detection" />}
          description={
            <FormattedMessage defaultMessage="Automatically process your request after you stop speaking." />
          }
          checked={autoSilenceEnabled}
          onChange={handleAutoSilenceToggle}
        />

        <SettingsRow
          title={<FormattedMessage defaultMessage="Power mode" />}
          description={
            <FormattedMessage defaultMessage="Allow the assistant to run terminal commands on your behalf. This is a temporary guardrail that will be removed in a future update. Restart Ryōiki Tenkai to apply changes." />
          }
          checked={powerModeEnabled}
          onChange={handlePowerModeToggle}
        />
      </Stack>
    </>
  );
};
