import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { showSnackbar } from "../../actions/app.actions";
import {
  activateLicense,
  deactivateLicense,
} from "../../actions/license.actions";
import { produceAppState, useAppStore } from "../../store";
import { getPurchaseUrl } from "../../utils/purchase.utils";

export const LicenseDialog = () => {
  const intl = useIntl();
  const open = useAppStore((state) => state.settings.licenseDialogOpen);
  const license = useAppStore((state) => state.license);
  const purchaseUrl = getPurchaseUrl();
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    produceAppState((draft) => {
      draft.settings.licenseDialogOpen = false;
    });
    setToken("");
    setSubmitting(false);
    setErrorMessage(null);
  };

  const handleActivate = async () => {
    if (!token.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await activateLicense(token);
      setToken("");
      produceAppState((draft) => {
        draft.settings.licenseDialogOpen = false;
      });
      showSnackbar("License activated.");
    } catch (error) {
      setErrorMessage(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await deactivateLicense();
      handleClose();
      showSnackbar("License removed from this device.");
    } catch (error) {
      setErrorMessage(String(error));
      setSubmitting(false);
    }
  };

  const expiresLabel = license?.expires
    ? intl.formatDate(new Date(license.expires * 1000), {
        dateStyle: "medium",
      })
    : null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <FormattedMessage defaultMessage="License" />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {license ? (
            <Alert severity="success" variant="outlined">
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight="bold">
                  {license.tier === "pro" ? (
                    <FormattedMessage defaultMessage="Pro license active" />
                  ) : (
                    <FormattedMessage defaultMessage="Normal license active" />
                  )}
                </Typography>
                <Typography variant="body2">{license.email}</Typography>
                {expiresLabel && (
                  <Typography variant="body2" color="text.secondary">
                    <FormattedMessage
                      defaultMessage="Expires {date}"
                      values={{ date: expiresLabel }}
                    />
                  </Typography>
                )}
              </Stack>
            </Alert>
          ) : (
            <Typography variant="body2" color="text.secondary">
              <FormattedMessage defaultMessage="Paste the license key you received after purchase. Activation is offline and unlocks the app on this device." />
            </Typography>
          )}

          {purchaseUrl && (
            <Button
              variant="text"
              onClick={() => void openUrl(purchaseUrl)}
              sx={{ alignSelf: "flex-start" }}
            >
              <FormattedMessage defaultMessage="Buy or upgrade a license" />
            </Button>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            label={<FormattedMessage defaultMessage="License key" />}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            disabled={submitting}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
          />

          {errorMessage && (
            <Alert severity="error" variant="outlined">
              {errorMessage}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {license && (
          <Button
            color="error"
            onClick={handleDeactivate}
            disabled={submitting}
            sx={{ mr: "auto" }}
          >
            <FormattedMessage defaultMessage="Deactivate" />
          </Button>
        )}
        <Button onClick={handleClose} disabled={submitting}>
          <FormattedMessage defaultMessage="Close" />
        </Button>
        <Button
          variant="contained"
          onClick={handleActivate}
          disabled={!token.trim() || submitting}
        >
          {submitting ? (
            <FormattedMessage defaultMessage="Activating..." />
          ) : (
            <FormattedMessage defaultMessage="Activate" />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
