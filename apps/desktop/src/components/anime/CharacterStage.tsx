import { Box, Stack, Typography } from "@mui/material";
import { ANIME_CHARACTERS, type AnimeFeature } from "../../utils/anime.utils";
import { useCharacterPose } from "./useCharacterPose";

type CharacterStageProps = {
  feature: AnimeFeature;
  height?: number | string;
  showName?: boolean;
  sx?: object;
};

export const CharacterStage = ({
  feature,
  height = "100%",
  showName = false,
  sx,
}: CharacterStageProps) => {
  const character = ANIME_CHARACTERS[feature];
  const pose = useCharacterPose(feature);

  if (!pose) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
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
          maxHeight: "100%",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
        }}
      />
      {showName && (
        <Stack
          spacing={0.25}
          sx={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            {character.name}
          </Typography>
        </Stack>
      )}
    </Box>
  );
};
