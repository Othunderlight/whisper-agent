import { Button, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { ScrollListPage } from "../common/ScrollListPage";
import { FocusRow } from "./FocusRow";

export default function FocusPage() {
  const nav = useNavigate();
  const checkIds = useAppStore((state) => state.focus.checkIds);
  const isChecking = useAppStore((state) => state.focus.isChecking);
  const enabled = useAppStore(
    (state) => state.focus.settings?.enabled ?? false,
  );

  const openSettings = () => nav("/dashboard/focus/settings");

  const subtitle = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="subtitle1" color="text.secondary">
        <FormattedMessage
          defaultMessage="{count} {count, plural, one {check} other {checks}}"
          values={{ count: checkIds.length }}
        />
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {"·"}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {isChecking ? (
          <FormattedMessage defaultMessage="Checking…" />
        ) : enabled ? (
          <FormattedMessage defaultMessage="Monitoring on" />
        ) : (
          <FormattedMessage defaultMessage="Monitoring off" />
        )}
      </Typography>
    </Stack>
  );

  const emptyState = (
    <Stack spacing={2} alignItems="center" textAlign="center">
      <Typography variant="h6" color="text.secondary">
        <FormattedMessage defaultMessage="No focus checks yet" />
      </Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={420}>
        <FormattedMessage defaultMessage="Set a focus goal, then Voquill will periodically screenshot your screen and use an AI vision model to tell you when you drift into a rabbit hole." />
      </Typography>
      <Button variant="contained" onClick={openSettings}>
        <FormattedMessage defaultMessage="Set up focus detection" />
      </Button>
    </Stack>
  );

  return (
    <ScrollListPage
      title={
        <FormattedMessage defaultMessage="Detect the Woman in Red Dress" />
      }
      subtitle={subtitle}
      action={
        <Button variant="outlined" onClick={openSettings}>
          <FormattedMessage defaultMessage="Settings" />
        </Button>
      }
      items={checkIds}
      computeItemKey={(id) => id}
      renderItem={(id) => <FocusRow id={id} />}
      emptyState={emptyState}
    />
  );
}
