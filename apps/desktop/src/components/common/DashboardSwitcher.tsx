import {
  ExpandMoreOutlined,
  MicOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { setActiveDashboard } from "../../actions/focus.actions";
import { ActiveDashboard } from "../../state/local.state";
import { useAppStore } from "../../store";
import { MenuPopoverBuilder, type MenuPopoverItem } from "./MenuPopover";

export const DashboardSwitcher = () => {
  const nav = useNavigate();
  const activeDashboard = useAppStore((state) => state.local.activeDashboard);

  const choose = (dashboard: ActiveDashboard) => {
    setActiveDashboard(dashboard);
    nav(dashboard === "focus" ? "/dashboard/focus" : "/dashboard");
  };

  const items: MenuPopoverItem[] = [
    {
      kind: "listItem",
      title: <FormattedMessage defaultMessage="Dictation" />,
      leading: <MicOutlined />,
      onClick: ({ close }) => {
        choose("transcription");
        close();
      },
    },
    {
      kind: "listItem",
      title: <FormattedMessage defaultMessage="Focus" />,
      leading: <VisibilityOutlined />,
      onClick: ({ close }) => {
        choose("focus");
        close();
      },
    },
  ];

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
              {activeDashboard === "focus" ? (
                <FormattedMessage defaultMessage="Focus" />
              ) : (
                <FormattedMessage defaultMessage="Dictation" />
              )}
            </Typography>
            <ExpandMoreOutlined fontSize="small" />
          </Stack>
        </Button>
      )}
    </MenuPopoverBuilder>
  );
};
