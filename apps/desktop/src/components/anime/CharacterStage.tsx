import { Box } from "@mui/material";
import { useCharacterPose } from "./useCharacterPose";
import type { AnimeFeature } from "../../utils/anime.utils";

type CharacterStageProps = {
  feature: AnimeFeature;
  height?: number | string;
  sx?: object;
};

export const CharacterStage = ({
  feature,
  height = "100%",
  sx,
}: CharacterStageProps) => {
  const pose = useCharacterPose(feature);

  if (!pose) return null;

  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        height,
        pointerEvents: "none",
        userSelect: "none",
        ...sx,
      }}
    >
      <Box
        component="img"
        src={pose}
        alt=""
        sx={{
          height: "100%",
          width: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
        }}
      />
    </Box>
  );
};
