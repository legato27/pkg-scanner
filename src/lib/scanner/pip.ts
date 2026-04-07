import { ScannerModule, ScannedPackage } from "./types";
import { execFileAsync, commandExists } from "./exec";

type PipPackage = {
  name: string;
  version: string;
};

export const pipScanner: ScannerModule = {
  name: "pip",

  async isAvailable() {
    return (await commandExists("pip3")) || (await commandExists("pip"));
  },

  async scan(): Promise<ScannedPackage[]> {
    const packages: ScannedPackage[] = [];
    const cmd = (await commandExists("pip3")) ? "pip3" : "pip";

    try {
      const { stdout } = await execFileAsync(cmd, [
        "list",
        "--format=json",
      ]);
      const data: PipPackage[] = JSON.parse(stdout);

      for (const pkg of data) {
        packages.push({
          name: pkg.name,
          version: pkg.version,
          manager: "pip",
        });
      }
    } catch (err) {
      console.error("pip scan error:", err);
    }

    return packages;
  },
};
