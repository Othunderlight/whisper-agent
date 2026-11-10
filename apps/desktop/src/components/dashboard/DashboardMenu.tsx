import {
  ChatBubbleOutline,
  ClassOutlined,
  HelpOutline,
  HistoryOutlined,
  HomeOutlined,
  PaletteOutlined,
  SettingsOutlined,
  TrackChangesOutlined,
} from "@mui/icons-material";
import { Box, List, Stack } from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FormattedMessage } from "react-intl";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { getIsAssistantModeEnabled } from "../../utils/assistant-mode.utils";
import { ListTile } from "../common/ListTile";
import { TelegramListTile } from "./TelegramListTile";
import { UpdateListTile } from "./UpdateListTile";

const settingsPath = "/dashboard/settings";

type NavItem = {
  label: React.ReactNode;
  path: string;
  icon: React.ReactNode;
};

export type DashboardMenuProps = {
  onChoose?: () => void;
};

export const DashboardMenu = ({ onChoose }: DashboardMenuProps) => {
  const location = useLocation();
  const nav = useNavigate();
  const isEnterprise = useAppStore((state) => state.isEnterprise);
  const isUpdateAvailable = useAppStore(
    (state) => state.updater.status === "ready",
  );
  const activeDashboard = useAppStore((state) => state.local.activeDashboard);
  const assistantModeEnabled = useAppStore(getIsAssistantModeEnabled);

  const navItems = useMemo<NavItem[]>(() => {
    if (activeDashboard === "assistant") {
      return [
        {
          label: <FormattedMessage defaultMessage="Chats" />,
          path: "/dashboard/assistant",
          icon: <ChatBubbleOutline />,
        },
        {
          label: <FormattedMessage defaultMessage="Settings" />,
          path: "/dashboard/assistant/settings",
          icon: <SettingsOutlined />,
        },
      ];
    }

    if (activeDashboard === "focus") {
      return [
        {
          label: <FormattedMessage defaultMessage="History" />,
          path: "/dashboard/focus",
          icon: <HistoryOutlined />,
        },
        {
          label: <FormattedMessage defaultMessage="Detection" />,
          path: "/dashboard/focus/settings",
          icon: <TrackChangesOutlined />,
        },
      ];
    }

    return [
      {
        label: <FormattedMessage defaultMessage="Home" />,
        path: "/dashboard",
        icon: <HomeOutlined />,
      },
      {
        label: <FormattedMessage defaultMessage="History" />,
        path: "/dashboard/transcriptions",
        icon: <HistoryOutlined />,
      },
      {
        label: <FormattedMessage defaultMessage="Dictionary" />,
        path: "/dashboard/dictionary",
        icon: <ClassOutlined />,
      },
      {
        label: <FormattedMessage defaultMessage="Styles" />,
        path: "/dashboard/styling",
        icon: <PaletteOutlined />,
      },
    ];
  }, [activeDashboard, assistantModeEnabled]);

  const onChooseHandler = (path: string) => {
    onChoose?.();
    nav(path);
  };

  const list = (
    <List
      sx={{
        px: 2,
        pb: 8,
      }}
    >
      {navItems.map(({ label, path, icon }) => (
        <ListTile
          key={path}
          onClick={() => onChooseHandler(path)}
          selected={location.pathname === path}
          leading={icon}
          title={label}
        />
      ))}
    </List>
  );

  return (
    <Stack alignItems="stretch" sx={{ height: "100%" }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>{list}</Box>
      <Box sx={{ mt: 2, p: 2 }}>
        {isUpdateAvailable && <UpdateListTile />}
        {isEnterprise ? (
          <ListTile
            onClick={() => openUrl("mailto:support@voquill.com")}
            leading={<HelpOutline />}
            title={<FormattedMessage defaultMessage="Support" />}
          />
        ) : (
          <TelegramListTile />
        )}
        <ListTile
          key={settingsPath}
          onClick={() => onChooseHandler(settingsPath)}
          selected={location.pathname === settingsPath}
          leading={<SettingsOutlined />}
          title={<FormattedMessage defaultMessage="Settings" />}
        />
      </Box>
    </Stack>
  );
};
