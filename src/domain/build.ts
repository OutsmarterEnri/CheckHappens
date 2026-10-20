export interface BuildInfo {
  appVersion: string;
  revision: string;
  dirty: boolean;
  id: string;
}
declare const __APP_BUILD__: BuildInfo;
export const BUILD_INFO: BuildInfo =
  typeof __APP_BUILD__ !== "undefined"
    ? __APP_BUILD__
    : {
        appVersion: "2.0.1",
        revision: "unknown",
        dirty: true,
        id: "unbundled",
      };
