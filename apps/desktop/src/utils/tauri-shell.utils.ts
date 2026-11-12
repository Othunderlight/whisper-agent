import { Channel, invoke } from "@tauri-apps/api/core";

type TerminatedPayload = {
  code: number | null;
  signal: number | null;
};

type CommandEvent =
  | { event: "Stdout"; payload: string }
  | { event: "Stderr"; payload: string }
  | { event: "Terminated"; payload: TerminatedPayload }
  | { event: "Error"; payload: string };

export type ShellSpawnOptions = {
  cwd?: string;
  env?: Record<string, string>;
};

export type ShellChildProcess = {
  pid: number;
  write: (buffer: string) => Promise<void>;
  kill: () => Promise<void>;
};

export type SpawnSidecarInput = {
  program: string;
  args?: string[];
  options?: ShellSpawnOptions;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  onClose?: (payload: TerminatedPayload) => void;
  onError?: (error: string) => void;
};

export const spawnShellSidecar = async ({
  program,
  args = [],
  options,
  onStdout,
  onStderr,
  onClose,
  onError,
}: SpawnSidecarInput): Promise<ShellChildProcess> => {
  const onEvent = new Channel<CommandEvent>();
  onEvent.onmessage = (event) => {
    switch (event.event) {
      case "Stdout":
        onStdout?.(event.payload);
        break;
      case "Stderr":
        onStderr?.(event.payload);
        break;
      case "Terminated":
        onClose?.(event.payload);
        break;
      case "Error":
        onError?.(event.payload);
        break;
    }
  };

  const pid = await invoke<number>("sidecar_spawn", {
    program,
    args,
    env: options?.env,
    cwd: options?.cwd,
    onEvent,
  });

  return {
    pid,
    async write(buffer) {
      await invoke("sidecar_write", { pid, buffer });
    },
    async kill() {
      await invoke("sidecar_kill", { pid });
    },
  };
};
