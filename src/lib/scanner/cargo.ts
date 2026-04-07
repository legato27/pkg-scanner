import { ScannerModule, ScannedPackage } from "./types";
import { execFileAsync, commandExists } from "./exec";

export const cargoScanner: ScannerModule = {
  name: "cargo",

  async isAvailable() {
    return commandExists("cargo");
  },

  async scan(): Promise<ScannedPackage[]> {
    const packages: ScannedPackage[] = [];

    try {
      const { stdout } = await execFileAsync("cargo", ["install", "--list"]);
      // Output format:
      // package-name v1.2.3:
      //     binary-name
      const lines = stdout.split("\n");
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+v(\S+):$/);
        if (match) {
          packages.push({
            name: match[1],
            version: match[2],
            manager: "cargo",
          });
        }
      }
    } catch (err) {
      console.error("cargo scan error:", err);
    }

    return packages;
  },
};
