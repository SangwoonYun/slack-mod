//go:build windows

package main

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func patchDesktopLauncher() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	appData, err := windowsRoamingAppData()
	if err != nil {
		return "", err
	}

	startMenuPrograms := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs")
	if err := os.MkdirAll(startMenuPrograms, 0o755); err != nil {
		return "", err
	}

	targetPath := filepath.Join(startMenuPrograms, "Slack Mod.lnk")
	iconPath := exePath
	if slackPath, err := getSlackPath(); err == nil {
		iconPath = slackPath
	}

	if err := createWindowsShortcut(targetPath, exePath, filepath.Dir(exePath), iconPath); err != nil {
		return "", err
	}

	return targetPath, nil
}

func windowsRoamingAppData() (string, error) {
	if appData := os.Getenv("APPDATA"); appData != "" {
		return appData, nil
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(homeDir, "AppData", "Roaming"), nil
}

func createWindowsShortcut(shortcutPath, targetPath, workingDir, iconPath string) error {
	script := fmt.Sprintf(`$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('%s')
$Shortcut.TargetPath = '%s'
$Shortcut.WorkingDirectory = '%s'
$Shortcut.IconLocation = '%s'
$Shortcut.Save()
`, quotePowerShellLiteral(shortcutPath), quotePowerShellLiteral(targetPath), quotePowerShellLiteral(workingDir), quotePowerShellLiteral(iconPath))

	output, err := runPowerShell(script)
	if err != nil {
		return fmt.Errorf("failed to create Start Menu shortcut: %w (%s)", err, strings.TrimSpace(string(output)))
	}

	return nil
}

func quotePowerShellLiteral(value string) string {
	return strings.ReplaceAll(value, "'", "''")
}

func runPowerShell(script string) ([]byte, error) {
	var lastErr error

	for _, bin := range []string{"powershell", "pwsh"} {
		path, err := exec.LookPath(bin)
		if err != nil {
			continue
		}

		cmd := exec.Command(
			path,
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy", "Bypass",
			"-Command", script,
		)

		output, runErr := cmd.CombinedOutput()
		if runErr == nil {
			return output, nil
		}

		lastErr = fmt.Errorf("%s failed: %w", bin, runErr)
	}

	if lastErr == nil {
		return nil, errors.New("PowerShell executable not found")
	}

	return nil, lastErr
}
