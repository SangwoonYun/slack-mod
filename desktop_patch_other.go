//go:build !linux && !darwin && !windows

package main

import "errors"

func patchDesktopLauncher() (string, error) {
	return "", errors.New("--patch-desktop is not supported on this platform")
}
