import { Box } from "@mui/material";
import { type PropsWithChildren, useState } from "react";
import { loadLicense } from "../../actions/license.actions";
import { useAsyncEffect } from "../../hooks/async.hooks";
import { useAppStore } from "../../store";
import { LoadingApp } from "../root/LoadingApp";
import { ActivationPage } from "./ActivationPage";

export const LicenseGate = ({ children }: PropsWithChildren) => {
  const license = useAppStore((state) => state.license);
  const [loaded, setLoaded] = useState(false);

  useAsyncEffect(async () => {
    await loadLicense();
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <Box sx={{ height: "100vh", width: "100vw" }}>
        <LoadingApp />
      </Box>
    );
  }

  if (!license) {
    return <ActivationPage />;
  }

  return <>{children}</>;
};
