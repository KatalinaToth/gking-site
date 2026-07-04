#!/usr/bin/env bash
# Install the Hugo version pinned in .github/workflows/deploy.yml into
# .tools/hugo-0.160.1/hugo (gitignored). Local `brew install hugo` often
# pulls a newer release that breaks this site's presentation mounts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="0.160.1"
BIN_DIR="$ROOT/.tools/hugo-${VERSION}"
BIN="$BIN_DIR/hugo"
PKG="hugo_extended_${VERSION}_darwin-universal.pkg"
URL="https://github.com/gohugoio/hugo/releases/download/v${VERSION}/${PKG}"

if [[ -x "$BIN" ]] && "$BIN" version 2>/dev/null | grep -q "v${VERSION}"; then
  exit 0
fi

uname_s="$(uname -s)"
if [[ "$uname_s" != "Darwin" ]]; then
  echo "ensure_hugo: pinned Hugo ${VERSION} auto-install is macOS-only." >&2
  echo "On Linux, install hugo_extended_${VERSION} to match CI, then rerun." >&2
  exit 1
fi

command -v curl >/dev/null || { echo "ensure_hugo: curl is required." >&2; exit 1; }
command -v xar >/dev/null || { echo "ensure_hugo: xar is required (macOS)." >&2; exit 1; }

tmpdir="$(mktemp -d)"
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

echo "ensure_hugo: downloading Hugo ${VERSION} (extended) …"
curl -fsSL -o "$tmpdir/$PKG" "$URL"

echo "ensure_hugo: extracting …"
(
  cd "$tmpdir"
  xar -xf "$PKG"
  mkdir -p staging
  cd staging
  cat ../Payload | gunzip -dc | cpio -id
)

extracted="$tmpdir/staging/hugo"
if [[ ! -x "$extracted" ]]; then
  echo "ensure_hugo: extraction failed; install ${PKG} manually from GitHub releases." >&2
  exit 1
fi

mkdir -p "$BIN_DIR"
cp "$extracted" "$BIN"
chmod +x "$BIN"
echo "ensure_hugo: installed $("$BIN" version)"
