import { Stack, Typography, type StackProps } from "@mui/material";
import { useAppStore } from "../../store";
import {
  ANIME_CHARACTERS,
  getActiveAnimeFeature,
} from "../../utils/anime.utils";

export type LogoWithTextProps = StackProps;

export const LogoWithText = ({ sx, ...rest }: LogoWithTextProps) => {
  const feature = useAppStore(getActiveAnimeFeature);
  const character = ANIME_CHARACTERS[feature];

  return (
    <Stack
      direction="row"
      sx={{
        display: "flex",
        alignItems: "center",
        userSelect: "none",
        ...sx,
      }}
      {...rest}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {character.name}
      </Typography>
    </Stack>
  );
};
