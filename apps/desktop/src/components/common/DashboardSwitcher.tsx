import {
  ChatBubbleOutline,
  ExpandMoreOutlined,
  MicOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { ActiveDashboard } from "../../state/local.state";
import { useAppStore } from "../../store";
import { getIsAssistantModeEnabled } from "../../utils/assistant-mode.utils";
import { MenuPopoverBuilder, type MenuPopoverItem } from "./MenuPopover";

type DashboardOption = {
  id: ActiveDashboard;
  label: React.ReactNode;
  icon: React.ReactNode;
  path: string;
};

const OPTIONS: DashboardOption[] = [
  {
    id: "transcription",
    label: <FormattedMessage defaultMessage="Toge Inumaki" />,
    icon: <MicOutlined />,
    path: "/dashboard",
  },
  {
    id: "focus",
    label: <FormattedMessage defaultMessage="Satoru Gojo" />,
    icon: <VisibilityOutlined />,
    path: "/dashboard/focus",
  },
  {
    id: "assistant",
    label: <FormattedMessage defaultMessage="Yuta Okkotsu" />,
    icon: <ChatBubbleOutline />,
    path: "/dashboard/assistant",
  },
];

export const DashboardSwitcher = () => {
  const nav = useNavigate();
  const activeDashboard = useAppStore((state) => state.local.activeDashboard);
  const assistantModeEnabled = useAppStore(getIsAssistantModeEnabled);
  const options = useMemo(
    () =>
      OPTIONS.filter(
        (option) =>
          option.id !== "assistant" ||
          assistantModeEnabled ||
          option.id === activeDashboard,
      ),
    [assistantModeEnabled, activeDashboard],
  );
  const activeOption =
    OPTIONS.find((option) => option.id === activeDashboard) ?? OPTIONS[0];

  const items: MenuPopoverItem[] = options.map((option) => ({
    kind: "listItem",
    title: option.label,
    leading: option.icon,
    onClick: ({ close }) => {
      nav(option.path);
      close();
    },
  }));

  return (
    <MenuPopoverBuilder
      items={items}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      {({ ref, open }) => (
        <Button
          ref={ref}
          onClick={open}
          size="small"
          sx={{ px: 1, py: 0.5, color: "text.secondary" }}
        >
          <Stack direction="row" spacing={0.25} alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>
              {activeOption.label}
            </Typography>
            <ExpandMoreOutlined fontSize="small" />
          </Stack>
        </Button>
      )}
    </MenuPopoverBuilder>
  );
};
