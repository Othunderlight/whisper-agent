import { Box } from "@mui/material";
import type { AnimeFeature } from "../../utils/anime.utils";
import { CharacterStage } from "./CharacterStage";

type DashboardCharacterProps = {
  feature: AnimeFeature;
};

export const DashboardCharacter = ({ feature }: DashboardCharacterProps) => (
  <Box
    aria-hidden
    sx={{
      display: { xs: "none", sm: "flex" },
      height: "100%",
      flexShrink: 0,
      alignItems: "flex-end",
      justifyContent: "flex-end",
      overflow: "hidden",
      pointerEvents: "none",
      pr: 2,
    }}
  >
    <CharacterStage feature={feature} />
  </Box>
);
