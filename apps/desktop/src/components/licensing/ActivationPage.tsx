import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { activateLicense } from "../../actions/license.actions";
import { getPurchaseUrl } from "../../utils/purchase.utils";
import { VectorField } from "../welcome/VectorField";

export const ActivationPage = () => {
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const purchaseUrl = getPurchaseUrl();

  const handleActivate = async () => {
    if (!token.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await activateLicense(token);
    } catch (error) {
      setErrorMessage(String(error));
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <VectorField />
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          width: "100%",
          px: 3,
          py: 6,
          overflowY: "auto",
        }}
      >
        <Card
          sx={{
            width: 560,
            maxWidth: "100%",
            p: { xs: 3, sm: 5 },
            boxShadow: 8,
          }}
        >
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={700}>
                <FormattedMessage defaultMessage="Activate Ryōiki Tenkai" />
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <FormattedMessage defaultMessage="Enter your license key to unlock the app on this device. Activation works fully offline." />
              </Typography>
            </Stack>

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

            <Button
              size="large"
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

            {purchaseUrl && (
              <Button variant="text" onClick={() => void openUrl(purchaseUrl)}>
                <FormattedMessage defaultMessage="Don't have a license? Buy one" />
              </Button>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              <FormattedMessage defaultMessage="Normal and Pro licenses are available. Your license is tied to the key you were issued, not to an online account." />
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
};
