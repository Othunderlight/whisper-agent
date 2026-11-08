import { Box, Stack, Typography } from "@mui/material";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { setActiveDashboard } from "../../actions/focus.actions";
import { useAsyncData } from "../../hooks/async.hooks";
import type { ActiveDashboard } from "../../state/local.state";
import { FocusSideEffects } from "../focus/FocusSideEffects";
import { TranscriptionDetailsDialog } from "../transcriptions/TranscriptionDetailsDialog";
import { DashboardMenu } from "./DashboardMenu";
import { FeatureReleaseDialog } from "./FeatureReleaseDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { TrialEndedDialog } from "./TrialEndedDialog";

const getDashboardForPath = (pathname: string): ActiveDashboard => {
  if (pathname.startsWith("/dashboard/focus")) return "focus";
  if (pathname.startsWith("/dashboard/assistant")) return "assistant";
  return "transcription";
};

export default function DashboardPage() {
  const data = useAsyncData(getVersion, []);
  const { pathname } = useLocation();

  useEffect(() => {
    setActiveDashboard(getDashboardForPath(pathname));
  }, [pathname]);

  return (
    <>
      <FeatureReleaseDialog />
      <PermissionsDialog />
      <TranscriptionDetailsDialog />
      <TrialEndedDialog />
      <FocusSideEffects />
      <Stack
        direction="row"
        sx={{ height: "100%", width: "100%", overflow: "hidden" }}
      >
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            width: 224,
            minWidth: 224,
            maxWidth: 224,
            overflowY: "auto",
          }}
        >
          <DashboardMenu />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </Box>
        <Typography
          variant="caption"
          sx={{
            position: "fixed",
            bottom: 0,
            left: 8,
            fontSize: "0.55rem",
            color: "text.secondary",
            opacity: 0.3,
          }}
        >
          {data.state === "success" ? `v${data.data}` : ""}
        </Typography>
      </Stack>
    </>
  );
}
