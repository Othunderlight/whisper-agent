export type AnimeFeature = "toge" | "satoru" | "yuta";

export type AnimeCharacter = {
  id: AnimeFeature;
  name: string;
  imagePrefix: string;
};

export const ANIME_CHARACTERS: Record<AnimeFeature, AnimeCharacter> = {
  toge: { id: "toge", name: "Toge Inumaki", imagePrefix: "inumaki" },
  satoru: { id: "satoru", name: "Satoru Gojo", imagePrefix: "gojo" },
  yuta: { id: "yuta", name: "Yuta Okkotsu", imagePrefix: "yuta" },
};

const characterModules = import.meta.glob("../assets/anime/characters/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const posesByPrefix = Object.entries(characterModules).reduce<
  Record<string, string[]>
>((acc, [path, url]) => {
  const fileName = path.split("/").pop() ?? "";
  const prefix = fileName.replace(/-vertical-\d+\.[a-z]+$/i, "");
  if (!prefix || prefix === fileName) return acc;
  acc[prefix] = [...(acc[prefix] ?? []), url];
  return acc;
}, {});

const pickPose = (prefix: string): string | null => {
  const poses = posesByPrefix[prefix] ?? [];
  if (poses.length === 0) return null;
  return poses[Math.floor(Math.random() * poses.length)];
};

export const getCharacterPose = (feature: AnimeFeature): string | null =>
  pickPose(ANIME_CHARACTERS[feature].imagePrefix);

const DASHBOARD_TO_FEATURE: Record<string, AnimeFeature> = {
  transcription: "toge",
  focus: "satoru",
  assistant: "yuta",
};

export const getActiveAnimeFeature = (state: {
  local: { activeDashboard: string };
}): AnimeFeature => DASHBOARD_TO_FEATURE[state.local.activeDashboard] ?? "toge";
