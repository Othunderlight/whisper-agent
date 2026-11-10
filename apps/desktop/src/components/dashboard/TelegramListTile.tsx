import { Box } from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FormattedMessage } from "react-intl";
import TelegramIcon from "../../assets/telegram.svg?react";
import { ListTile } from "../common/ListTile";

const TELEGRAM_URL = "https://t.me/ryoikiXtenkai";

export const TelegramListTile = () => (
  <ListTile
    onClick={() => openUrl(TELEGRAM_URL)}
    leading={
      <Box
        component={TelegramIcon}
        sx={{ color: "#26A5E4", width: 22, height: 22 }}
      />
    }
    title={<FormattedMessage defaultMessage="Telegram" />}
  />
);
