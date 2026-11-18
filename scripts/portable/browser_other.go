//go:build !windows

package main

import "errors"

func openBrowser(string) error {
	return errors.New("la apertura automatica se ofrece en Windows")
}
