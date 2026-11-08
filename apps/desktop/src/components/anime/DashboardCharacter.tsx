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
      width: { sm: 260, md: 380, lg: 540, xl: 660 },
      flexShrink: 0,
      height: "100%",
      overflow: "hidden",
      pl: 1,
    }}
  >
    <CharacterStage feature={feature} />
  </Box>
);
