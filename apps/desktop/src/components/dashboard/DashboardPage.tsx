import { Box, Stack, Typography } from "@mui/material";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { setActiveDashboard } from "../../actions/focus.actions";
import { useAsyncData } from "../../hooks/async.hooks";
import type { ActiveDashboard } from "../../state/local.state";
import type { AnimeFeature } from "../../utils/anime.utils";
import { DashboardCharacter } from "../anime/DashboardCharacter";
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

const DASHBOARD_FEATURE: Record<ActiveDashboard, AnimeFeature> = {
  transcription: "toge",
  focus: "satoru",
  assistant: "yuta",
};

export default function DashboardPage() {
  const data = useAsyncData(getVersion, []);
  const { pathname } = useLocation();
  const dashboard = getDashboardForPath(pathname);

  useEffect(() => {
    setActiveDashboard(dashboard);
  }, [dashboard]);

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
        <Stack
          direction="row"
          sx={{ flexGrow: 1, minWidth: 0, height: "100%" }}
        >
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
          <DashboardCharacter feature={DASHBOARD_FEATURE[dashboard]} />
        </Stack>
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
