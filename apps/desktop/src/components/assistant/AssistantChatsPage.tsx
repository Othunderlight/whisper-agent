import { Box, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import ChatsPage from "../chats/ChatsPage";

export default function AssistantChatsPage() {
  return (
    <Stack sx={{ height: "100%", minHeight: 0, px: 2, pt: 1, pb: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", width: "100%", pb: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          <FormattedMessage defaultMessage="Chats" />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <FormattedMessage defaultMessage="Command the domain with your voice and keep every conversation in one place." />
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        <ChatsPage />
      </Box>
    </Stack>
  );
}
