# frontend/flake.nix
{
  description = "Vite Preact frontend";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux"; # Adjust for your arch, e.g., aarch64-linux
      pkgs = nixpkgs.legacyPackages.${system};
      nodejs = pkgs.nodejs_20; # Or whichever version your Vite setup needs
    in
    {
      packages.${system}.default = pkgs.mkYarnPackage {
        name = "frontend";
        version = "v0.1.0";
        src = ./.;
        packageJSON = ./package.json;
        yarnLock = ./yarn.lock; # Generate with `yarn install --frozen-lockfile` if needed
        buildPhase = ''
          export NODE_ENV=production
          yarn --offline build  # Runs `vite build` assuming your package.json script
        '';
        installPhase = ''
          cp -r dist $out/
        '';
        distPhase = "true"; # Skip tarball creation
      };

      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          nodejs
          pkgs.yarn
        ];
        shellHook = ''
          echo "Enter dev shell: run 'yarn install' then 'yarn dev' for local dev on :5173"
        '';
      };
    };
}
