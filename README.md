# Slack Mod

`slack-mod` launches the official Slack desktop app and injects custom JS/CSS at runtime.
It does not modify Slack installation files.

## What is included

- Runtime injector written in Go
- Injection assets in `injection/script.js` and `injection/style.css`
- Desktop launcher patch command (`--patch-desktop`) for Windows/macOS/Linux

Default injected script features:

- Channel/DM alias rename UI (click-to-select)
- Alias manager (right-click from the top button)
- Localized UI (en/de/es/fr/it/pt/ja/zh/ko)
- Alias persistence via IndexedDB + localStorage sync fallback

## Requirements

- Go 1.20+
- Installed Slack desktop client
- `injection/` folder present next to the binary (or run from a working directory that contains `injection/`)

## Build

### Windows

```sh
go build -ldflags "-s -w -H=windowsgui" -o slack-mod.exe
```

### macOS

```sh
go build -ldflags "-s -w" -o slack-mod
```

### Linux

```sh
go build -ldflags "-s -w" -o slack-mod
```

## Run

### Windows

```powershell
.\slack-mod.exe
```

### macOS

```sh
./slack-mod
```

### Linux

```sh
./slack-mod
```

`slack-mod` automatically:

1. Finds a free localhost debugging port
2. Launches Slack with remote debugging enabled
3. Connects to Slack DevTools WebSocket
4. Injects `injection/script.js` and `injection/style.css`

## Desktop launcher patch

Create an OS launcher entry:

```sh
./slack-mod --patch-desktop
```

Or use helper scripts (recommended).  
They copy the binary (and `injection/`) to a stable user location first, then run `--patch-desktop`.

```sh
./patch-desktop.sh
```

```bat
patch-desktop.bat
```

Platform behavior:

- `patch-desktop.sh`: installs to `${XDG_DATA_HOME:-~/.local/share}/slack-mod/slack-mod`
- `patch-desktop.bat`: installs to `%LOCALAPPDATA%\slack-mod\slack-mod.exe`
- Windows: creates `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Slack Mod.lnk`
- macOS: creates `~/Applications/Slack Mod.app`
- Linux: writes `~/.local/share/applications/slack.desktop` and rewrites `Exec=`

## Customize

- Edit logic/UI: `injection/script.js`
- Edit styles: `injection/style.css`

Re-run `slack-mod` after changes.
