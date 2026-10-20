export function getBuildInfo(root?: string): {
  appVersion: string;
  revision: string;
  dirty: boolean;
  id: string;
};
