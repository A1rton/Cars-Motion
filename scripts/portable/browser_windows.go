package main

import (
	"fmt"
	"runtime"
	"syscall"
	"unsafe"
)

func openBrowser(url string) error {
	address, err := syscall.UTF16PtrFromString(url)
	if err != nil {
		return err
	}
	// Shell extensions can require a single-threaded COM apartment.
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()
	ole := syscall.NewLazyDLL("ole32.dll")
	status, _, _ := ole.NewProc("CoInitializeEx").Call(0, 2|4) // Apartment-threaded, disable OLE1 DDE.
	if status == 0 || status == 1 {
		defer ole.NewProc("CoUninitialize").Call()
	}
	open := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW")
	result, _, _ := open.Call(0, 0, uintptr(unsafe.Pointer(address)), 0, 0, 1)
	if result <= 32 {
		return fmt.Errorf("codigo de Windows %d", result)
	}
	return nil
}
