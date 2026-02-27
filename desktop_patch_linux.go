//go:build linux

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

	userDesktopDir := filepath.Join(homeDir, ".local", "share", "applications")
	if err := os.MkdirAll(userDesktopDir, 0o755); err != nil {
		return "", err
	}

	targetPath := filepath.Join(userDesktopDir, "slack.desktop")
	content, err := loadDesktopTemplate()
	if err != nil {
		return "", err
	}

	content = patchExecLine(content, exePath)
	if err := os.WriteFile(targetPath, []byte(content), 0o644); err != nil {
		return "", err
	}

	return targetPath, nil
}

func loadDesktopTemplate() (string, error) {
	candidates := []string{
		"/usr/share/applications/slack.desktop",
		"/var/lib/snapd/desktop/applications/slack_slack.desktop",
	}

	for _, candidate := range candidates {
		if !fileExists(candidate) {
			continue
		}
		raw, err := os.ReadFile(candidate)
		if err != nil {
			return "", err
		}
		return string(raw), nil
	}

	// Fallback template if Slack desktop file cannot be discovered.
	return `[Desktop Entry]
Type=Application
Name=Slack
Comment=Slack Desktop
Terminal=false
Categories=Network;InstantMessaging;
Exec=slack %U
`, nil
}

func patchExecLine(content, exePath string) string {
	lines := strings.Split(content, "\n")
	execLine := fmt.Sprintf("Exec=%s %%U", escapeDesktopExecPath(exePath))

	for i, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), "Exec=") {
			lines[i] = execLine
			return strings.Join(lines, "\n")
		}
	}

	lines = append(lines, execLine)
	return strings.Join(lines, "\n")
}

func escapeDesktopExecPath(path string) string {
	return strings.ReplaceAll(path, " ", `\ `)
}
