interface RyoikiTenkaiEnv {
  RYOIKI_TENKAI_GATEWAY_URL?: string;
  RYOIKI_TENKAI_APP_NAME?: string;
}

declare global {
  interface Window {
    __RYOIKI_TENKAI__?: RyoikiTenkaiEnv;
  }
}

export function getGatewayUrl(): string {
  return (
    window.__RYOIKI_TENKAI__?.RYOIKI_TENKAI_GATEWAY_URL ||
    "http://localhost:4630"
  );
}

export function isDev(): boolean {
  return import.meta.env.DEV;
}

export function getAppName(): string {
  return (
    window.__RYOIKI_TENKAI__?.RYOIKI_TENKAI_APP_NAME ||
    "Ryōiki Tenkai Enterprise"
  );
}

export function getAppVersion(): string {
  return import.meta.env.VITE_VERSION || "0.0.1";
}
