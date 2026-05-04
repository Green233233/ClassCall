package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

// showMessageBoxTimeout displays a simple message box that auto-closes after timeoutMs milliseconds.
// It uses the Win32 API MessageBoxTimeoutW. If the function is unavailable, it falls back to MessageBoxW without timeout.
func showMessageBoxTimeout(title, text string, timeoutMs uint32) {
	user32 := syscall.NewLazyDLL("user32.dll")
	mbt := user32.NewProc("MessageBoxTimeoutW")
	mb := user32.NewProc("MessageBoxW")
	utf16Ptr := func(s string) uintptr {
		p, _ := syscall.UTF16PtrFromString(s)
		return uintptr(unsafe.Pointer(p))
	}
	// MB_TOPMOST | MB_SETFOREGROUND | MB_OK
	flags := uintptr(0x00040000 | 0x00010000 | 0x00000000)
	if mbt.Find() == nil {
		// Call MessageBoxTimeoutW
		mbt.Call(0, utf16Ptr(text), utf16Ptr(title), flags, 0, uintptr(timeoutMs))
		return
	}
	// Fallback to MessageBoxW (blocking)
	mb.Call(0, utf16Ptr(text), utf16Ptr(title), flags)
}

func findMainExe(dir, self string) (string, error) {
	// Look for exe files in dir and pick the first that is not the launcher itself and likely the electron bundle.
	matches, err := filepath.Glob(filepath.Join(dir, "*.exe"))
	if err != nil {
		return "", err
	}
	for _, f := range matches {
		if strings.EqualFold(f, self) {
			continue
		}
		name := strings.ToLower(filepath.Base(f))
		// prefer files containing "classcall" or "点星" or not containing "launcher"
		if strings.Contains(name, "classcall") || strings.Contains(name, "点星") || !strings.Contains(name, "launcher") {
			return f, nil
		}
	}
	// fallback: first exe that isn't self
	for _, f := range matches {
		if !strings.EqualFold(f, self) {
			return f, nil
		}
	}
	return "", fmt.Errorf("no candidate exe found in %s", dir)
}

func main() {
	self, err := os.Executable()
	if err != nil {
		// if we can't determine our own path, show a simple blocking message and exit
		showMessageBoxTimeout("ClassCall 点星", "正在启动，请稍候...", 3000)
		return
	}
	dir := filepath.Dir(self)
	mainExe, err := findMainExe(dir, self)
	if err != nil {
		showMessageBoxTimeout("ClassCall 点星", "正在启动，请稍候...", 3000)
		return
	}

	// Start the main exe asynchronously
	cmd := exec.Command(mainExe)
	cmd.Dir = dir
	// Start without waiting
	if err := cmd.Start(); err != nil {
		showMessageBoxTimeout("ClassCall 点星", "启动失败，请稍后重试。", 4000)
		return
	}

	// Show a non-blocking splash message for up to 4 seconds while the real app boots
	showMessageBoxTimeout("ClassCall 点星", "正在启动，请稍候...", 4000)

	// Give child a brief moment to detach; then exit launcher
	time.Sleep(200 * time.Millisecond)
}
