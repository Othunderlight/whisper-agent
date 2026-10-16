import { getRec } from "@voquill/utilities";
import { FocusStatus } from "@voquill/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Box, Chip, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { memo } from "react";
import { FormattedMessage } from "react-intl";
import { useAppStore } from "../../store";
import { focusStatusColor } from "../../utils/focus.utils";

dayjs.extend(relativeTime);

const statusLabel = (status: FocusStatus) => {
  switch (status) {
    case "focused":
      return <FormattedMessage defaultMessage="Focused" />;
    case "distracted":
      return <FormattedMessage defaultMessage="Distracted" />;
    case "neutral":
      return <FormattedMessage defaultMessage="Neutral" />;
    default:
      return <FormattedMessage defaultMessage="Error" />;
  }
};

export const FocusRow = memo(({ id }: { id: string }) => {
  const check = useAppStore((state) => getRec(state.focusCheckById, id));

  if (!check) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        py: 1.5,
        px: 0.5,
        borderRadius: 1,
        "&:hover": { bgcolor: "var(--app-palette-level1)" },
        transition: "background-color 0.15s",
      }}
    >
      <Box
        component="img"
        src={convertFileSrc(check.screenshotPath)}
        alt=""
        sx={{
          width: 120,
          height: 75,
          objectFit: "cover",
          borderRadius: 1,
          bgcolor: "level1",
          flexShrink: 0,
        }}
      />
      <Stack spacing={0.75} sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={statusLabel(check.status)}
            sx={{
              height: 20,
              fontWeight: 600,
              color: focusStatusColor(check.status),
              bgcolor: "level1",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {dayjs(check.createdAt).fromNow()}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          <FormattedMessage
            defaultMessage="Distraction: {score} / 2"
            values={{ score: check.distractionScore.toFixed(2) }}
          />
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <FormattedMessage
            defaultMessage="Confidence: {value}"
            values={{ value: `${Math.round(check.confidence * 100)}%` }}
          />
        </Typography>
        {check.error ? (
          <Typography variant="caption" color="error.main">
            {check.error}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
});
