export type ScannedPackage = {
  name: string;
  version: string | null;
  manager: "brew" | "npm" | "pip" | "cargo" | "gem";
  description?: string;
  homepage?: string;
  license?: string;
};

export type ScannerModule = {
  name: string;
  isAvailable: () => Promise<boolean>;
  scan: () => Promise<ScannedPackage[]>;
};
