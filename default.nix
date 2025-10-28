# default.nix
{ stdenv }:

stdenv.mkDerivation {
  pname = "frontend-package";
  version = "1.0";

  src = ./.;

  dontUnpack = true;
  dontBuild = true;

  installPhase = ''
    mkdir -p $out
    cp -r $src/dist/* $out/
  '';
}
