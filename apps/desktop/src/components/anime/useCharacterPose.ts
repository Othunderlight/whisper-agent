import { useState } from "react";
import { getCharacterPose, type AnimeFeature } from "../../utils/anime.utils";

export const useCharacterPose = (feature: AnimeFeature): string | null =>
  useState(() => getCharacterPose(feature))[0];
