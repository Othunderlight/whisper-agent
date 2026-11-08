import { Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { DashboardEntryLayout } from "../dashboard/DashboardEntryLayout";
import { AssistantSettings } from "./AssistantSettings";

export default function AssistantSettingsPage() {
  return (
    <DashboardEntryLayout maxWidth="md">
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        <FormattedMessage defaultMessage="Assistant mode" />
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <FormattedMessage defaultMessage="Configure how assistant mode follows your commands." />
      </Typography>
      <Stack spacing={3} alignItems="flex-start">
        <AssistantSettings />
      </Stack>
    </DashboardEntryLayout>
  );
}
