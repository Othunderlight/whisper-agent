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
      component="img"
      src={pose}
      alt=""
      aria-hidden
      sx={{
        height: "100%",
        width: "auto",
        maxWidth: { sm: 240, md: 340, lg: 460 },
        objectFit: "contain",
        objectPosition: "bottom right",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
};
