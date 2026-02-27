#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
INSTALL_BASE="${XDG_DATA_HOME:-$HOME/.local/share}"
INSTALL_DIR="$INSTALL_BASE/slack-mod"
INSTALL_BIN="$INSTALL_DIR/slack-mod"
OS_NAME="$(uname -s)"

if [ -x "$SCRIPT_DIR/slack-mod" ]; then
  SRC_BIN="$SCRIPT_DIR/slack-mod"
elif [ -x "$SCRIPT_DIR/slack-mod.exe" ]; then
  SRC_BIN="$SCRIPT_DIR/slack-mod.exe"
else
  echo "slack-mod binary not found in: $SCRIPT_DIR" >&2
  echo "Build first, e.g.:" >&2
  echo "  go build -ldflags \"-s -w\" -o slack-mod" >&2
  exit 1
fi

if [ "$OS_NAME" = "Darwin" ] && command -v xattr >/dev/null 2>&1; then
  xattr -d com.apple.quarantine "$SRC_BIN" 2>/dev/null || true
fi

mkdir -p "$INSTALL_DIR"
cp -f "$SRC_BIN" "$INSTALL_BIN"
chmod 755 "$INSTALL_BIN"

if [ -d "$SCRIPT_DIR/injection" ]; then
  mkdir -p "$INSTALL_DIR/injection"
  cp -R "$SCRIPT_DIR/injection/." "$INSTALL_DIR/injection/"
fi

if [ "$OS_NAME" = "Darwin" ] && command -v xattr >/dev/null 2>&1; then
  xattr -dr com.apple.quarantine "$INSTALL_DIR" 2>/dev/null || true
fi

"$INSTALL_BIN" --patch-desktop "$@"
