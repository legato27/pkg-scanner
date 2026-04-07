import { ScannerModule, ScannedPackage } from "./types";
import { execFileAsync, commandExists } from "./exec";

type BrewFormulaInfo = {
  name: string;
  versions: { stable: string };
  desc: string;
  homepage: string;
  license: string;
};

type BrewCaskInfo = {
  token: string;
  version: string;
  desc: string;
  homepage: string;
};

type BrewInfoResponse = {
  formulae: BrewFormulaInfo[];
  casks: BrewCaskInfo[];
};

export const brewScanner: ScannerModule = {
  name: "brew",

  async isAvailable() {
    return commandExists("brew");
  },

  async scan(): Promise<ScannedPackage[]> {
    const packages: ScannedPackage[] = [];

    // Get formulae info
    try {
      const { stdout } = await execFileAsync("brew", [
        "info",
        "--json=v2",
        "--installed",
      ]);
      const data: BrewInfoResponse = JSON.parse(stdout);

      for (const formula of data.formulae) {
        packages.push({
          name: formula.name,
          version: formula.versions.stable,
          manager: "brew",
          description: formula.desc,
          homepage: formula.homepage,
          license: formula.license,
        });
      }

      for (const cask of data.casks) {
        packages.push({
          name: cask.token,
          version: cask.version,
          manager: "brew",
          description: cask.desc,
          homepage: cask.homepage,
        });
      }
    } catch (err) {
      console.error("Brew scan error:", err);
    }

    return packages;
  },
};
