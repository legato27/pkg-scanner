import { ScannerModule, ScannedPackage } from "./types";
import { execFileAsync, commandExists } from "./exec";

type NpmDependency = {
  version: string;
  resolved?: string;
};

type NpmListOutput = {
  dependencies?: Record<string, NpmDependency>;
};

export const npmScanner: ScannerModule = {
  name: "npm",

  async isAvailable() {
    return commandExists("npm");
  },

  async scan(): Promise<ScannedPackage[]> {
    const packages: ScannedPackage[] = [];

    try {
      const { stdout } = await execFileAsync("npm", [
        "list",
        "-g",
        "--json",
        "--depth=0",
      ]);
      const data: NpmListOutput = JSON.parse(stdout);

      if (data.dependencies) {
        for (const [name, info] of Object.entries(data.dependencies)) {
          packages.push({
            name,
            version: info.version,
            manager: "npm",
          });
        }
      }
    } catch (err) {
      console.error("npm scan error:", err);
    }

    return packages;
  },
};
