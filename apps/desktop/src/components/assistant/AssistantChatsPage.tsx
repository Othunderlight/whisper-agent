import { Box, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { FeatureStage } from "../anime/FeatureStage";
import ChatsPage from "../chats/ChatsPage";

export default function AssistantChatsPage() {
  return (
    <FeatureStage feature="yuta">
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            <FormattedMessage defaultMessage="Yuta Okkotsu" />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <FormattedMessage defaultMessage="Command the domain with your voice and keep every conversation in one place." />
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <ChatsPage />
        </Box>
      </Box>
    </FeatureStage>
  );
}
