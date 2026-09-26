import { UploadOutlined } from "@mui/icons-material";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { showErrorSnackbar } from "../../actions/app.actions";
import {
  getWakewordConfig,
  importWakewordModel,
  listWakewordModels,
  setWakewordConfig,
} from "../../actions/settings.actions";
import { produceAppState, useAppStore } from "../../store";
import type {
  WakewordConfig,
  WakewordModelInfo,
} from "../../types/wakeword.types";
import { SettingSection } from "../common/SettingSection";

const OFF = "";

type Slot = keyof WakewordConfig;

export const WakeWordDialog = () => {
  const open = useAppStore((state) => state.settings.wakeWordDialogOpen);
  const [models, setModels] = useState<WakewordModelInfo[]>([]);
  const [config, setConfig] = useState<WakewordConfig>({
    dictation: null,
    agent: null,
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (): Promise<WakewordConfig | null> => {
    try {
      const [available, current] = await Promise.all([
        listWakewordModels(),
        getWakewordConfig(),
      ]);
      setModels(available);
      setConfig(current);
      return current;
    } catch (error) {
      showErrorSnackbar(error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.wakeWordDialogOpen = false;
    });
  };

  const handleSelect = async (slot: Slot, value: string) => {
    const next = { ...config, [slot]: value || null };
    setConfig(next);

    try {
      await setWakewordConfig(next);
    } catch (error) {
      showErrorSnackbar(error);
      await load();
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setImporting(true);
    try {
      const imported = await importWakewordModel(file);
      const latest = await load();
      // Reloads the listener only when a slot already points at that name, so
      // replacing a model that had gone missing takes effect straight away.
      if (
        latest &&
        (latest.dictation === imported || latest.agent === imported)
      ) {
        await setWakewordConfig(latest);
      }
    } catch (error) {
      showErrorSnackbar(error);
    } finally {
      setImporting(false);
    }
  };

  const renderSelect = (slot: Slot, label: string) => {
    const current = config[slot] ?? OFF;
    const names = models.map((model) => model.name);
    const options =
      current !== OFF && !names.includes(current) ? [...names, current] : names;

    return (
      <Select
        size="small"
        value={current}
        onChange={(event) => void handleSelect(slot, event.target.value)}
        sx={{ minWidth: 190 }}
        inputProps={{ "aria-label": label }}
      >
        <MenuItem value={OFF}>
          <FormattedMessage defaultMessage="Off" />
        </MenuItem>
        {options.map((name) => {
          const model = models.find((entry) => entry.name === name);
          return (
            <MenuItem key={name} value={name}>
              {name.replace(/\.onnx$/i, "")}
              {model?.builtin && (
                <Chip
                  label={<FormattedMessage defaultMessage="Built-in" />}
                  size="small"
                  sx={{ ml: 1, height: 18, fontSize: 11 }}
                />
              )}
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        <FormattedMessage defaultMessage="Wake words" />
      </DialogTitle>
      <DialogContent sx={{ minWidth: 440 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          <FormattedMessage defaultMessage="Each phrase starts something on its own. Models are openWakeWord .onnx files trained on your voice." />
        </Typography>

        <SettingSection
          sx={{ mb: 2 }}
          title={<FormattedMessage defaultMessage="Start dictation" />}
          description={
            <FormattedMessage defaultMessage="Say a phrase to begin typing what you say." />
          }
          action={renderSelect("dictation", "Dictation wake word")}
        />
        <SettingSection
          sx={{ mb: 3 }}
          title={<FormattedMessage defaultMessage="Talk to the assistant" />}
          description={
            <FormattedMessage defaultMessage="Say a phrase to open a conversation with the assistant." />
          }
          action={renderSelect("agent", "Assistant wake word")}
        />

        <Button
          variant="outlined"
          disabled={importing}
          startIcon={<UploadOutlined />}
          onClick={() => fileInputRef.current?.click()}
        >
          <FormattedMessage defaultMessage="Add a model" />
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          <FormattedMessage defaultMessage="Copies an .onnx file into this app so you can pick it above. Anything that is not a compatible wake word model is rejected." />
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          accept=".onnx"
          hidden
          onChange={(event) => void handleImport(event)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          <FormattedMessage defaultMessage="Close" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};
