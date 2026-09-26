export type WakewordModelInfo = {
  name: string;
  builtin: boolean;
};

/** `null` turns the wake word slot off. */
export type WakewordConfig = {
  dictation: string | null;
  agent: string | null;
};
