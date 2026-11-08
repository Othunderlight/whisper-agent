import { Box } from "@mui/material";
import type { AnimeFeature } from "../../utils/anime.utils";
import { useCharacterPose } from "./useCharacterPose";

type CharacterStageProps = {
  feature: AnimeFeature;
};

export const CharacterStage = ({ feature }: CharacterStageProps) => {
  const pose = useCharacterPose(feature);

  if (!pose) return null;

  return (
    <Box
      aria-hidden
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <Box
        component="img"
        src={pose}
        alt=""
        sx={{
          height: "100%",
          width: "auto",
          maxHeight: "100%",
          objectFit: "contain",
          objectPosition: "bottom right",
        }}
      />
    </Box>
  );
};
