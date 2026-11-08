import { useMemo } from "react";
import { getCharacterPose, type AnimeFeature } from "../../utils/anime.utils";

export const useCharacterPose = (feature: AnimeFeature): string | null =>
  useMemo(() => getCharacterPose(feature), [feature]);
