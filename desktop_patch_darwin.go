//go:build darwin

package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func patchDesktopLauncher() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	appBundleDir := filepath.Join(homeDir, "Applications", "Slack Mod.app")
	contentsDir := filepath.Join(appBundleDir, "Contents")
	macOSDir := filepath.Join(contentsDir, "MacOS")

	if err := os.MkdirAll(macOSDir, 0o755); err != nil {
		return "", err
	}

	launcherPath := filepath.Join(macOSDir, "Slack Mod")
	launcherScript := fmt.Sprintf("#!/bin/sh\nexec %s \"$@\"\n", quoteShellPath(exePath))
	if err := os.WriteFile(launcherPath, []byte(launcherScript), 0o755); err != nil {
		return "", err
	}

	plistPath := filepath.Join(contentsDir, "Info.plist")
	if err := os.WriteFile(plistPath, []byte(desktopPatchInfoPlist()), 0o644); err != nil {
		return "", err
	}

	return appBundleDir, nil
}

func quoteShellPath(path string) string {
	return "'" + strings.ReplaceAll(path, "'", "'\"'\"'") + "'"
}

func desktopPatchInfoPlist() string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>Slack Mod</string>
	<key>CFBundleExecutable</key>
	<string>Slack Mod</string>
	<key>CFBundleIdentifier</key>
	<string>io.github.slackmod.launcher</string>
	<key>CFBundleName</key>
	<string>Slack Mod</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
</dict>
</plist>
`
}
