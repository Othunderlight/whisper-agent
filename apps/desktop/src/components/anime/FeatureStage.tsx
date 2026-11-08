import { Box } from "@mui/material";
import type { AnimeFeature } from "../../utils/anime.utils";
import { CharacterStage } from "./CharacterStage";

type FeatureStageProps = {
  feature: AnimeFeature;
  children: React.ReactNode;
};

export const FeatureStage = ({ feature, children }: FeatureStageProps) => (
  <Box
    sx={{
      flexGrow: 1,
      minWidth: 0,
      height: "100%",
      display: "flex",
      overflow: "hidden",
    }}
  >
    <Box sx={{ flexGrow: 1, minWidth: 0, height: "100%" }}>{children}</Box>
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        width: 200,
        flexShrink: 0,
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
        pr: 1,
      }}
    >
      <CharacterStage
        feature={feature}
        sx={{
          height: "100%",
          width: "100%",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 6%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 6%, black 100%)",
        }}
      />
    </Box>
  </Box>
);
