import { ScannerModule, ScannedPackage } from "./types";
import { execFileAsync, commandExists } from "./exec";

export const gemScanner: ScannerModule = {
  name: "gem",

  async isAvailable() {
    return commandExists("gem");
  },

  async scan(): Promise<ScannedPackage[]> {
    const packages: ScannedPackage[] = [];

    try {
      const { stdout } = await execFileAsync("gem", ["list", "--local"]);
      // Output format: gem-name (1.2.3, 1.0.0)
      const lines = stdout.split("\n");
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+\((.+)\)$/);
        if (match) {
          const versions = match[2].split(",").map((v) => v.trim());
          packages.push({
            name: match[1],
            version: versions[0], // latest installed version
            manager: "gem",
          });
        }
      }
    } catch (err) {
      console.error("gem scan error:", err);
    }

    return packages;
  },
};
