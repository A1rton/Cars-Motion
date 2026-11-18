package main

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

var contentTypes = map[string]string{
	".css":   "text/css; charset=utf-8",
	".html":  "text/html; charset=utf-8",
	".js":    "text/javascript; charset=utf-8",
	".json":  "application/json; charset=utf-8",
	".png":   "image/png",
	".svg":   "image/svg+xml",
	".webp":  "image/webp",
	".woff2": "font/woff2",
}

func serveFiles(root *os.Root, host string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")

		if r.Host != host {
			http.Error(w, "Direccion local no valida.", http.StatusBadRequest)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "Metodo no permitido.", http.StatusMethodNotAllowed)
			return
		}

		name := strings.TrimPrefix(r.URL.Path, "/")
		if name == "" {
			name = "index.html"
		}
		if !filepath.IsLocal(name) || strings.ContainsAny(name, "\\:") || path.Clean(name) != name {
			http.NotFound(w, r)
			return
		}
		file, err := root.Open(name)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer file.Close()
		info, err := file.Stat()
		if err != nil || !info.Mode().IsRegular() {
			http.NotFound(w, r)
			return
		}

		if contentType, ok := contentTypes[strings.ToLower(path.Ext(name))]; ok {
			w.Header().Set("Content-Type", contentType)
		}
		http.ServeContent(w, r, info.Name(), info.ModTime(), file)
	}
}

func run() error {
	executable, err := os.Executable()
	if err != nil {
		return fmt.Errorf("no se pudo ubicar la carpeta extraida: %w", err)
	}
	dist := filepath.Join(filepath.Dir(executable), "..", "dist")
	root, err := os.OpenRoot(dist)
	if err != nil {
		return errors.New("falta la carpeta dist o no se puede abrir. Volve a extraer el ZIP completo")
	}
	defer root.Close()
	index, err := root.Stat("index.html")
	if err != nil || !index.Mode().IsRegular() {
		return errors.New("falta dist/index.html. Volve a extraer el ZIP completo")
	}

	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("no se pudo iniciar el servidor local: %w", err)
	}
	defer listener.Close()

	host := listener.Addr().String()
	url := "http://" + host + "/"
	server := &http.Server{
		Handler:           serveFiles(root, host),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	fmt.Printf("CarsMotion esta listo: %s\n", url)
	fmt.Println("Deja esta ventana abierta mientras uses la pagina.")
	fmt.Println("Si el navegador no se abre, copia la direccion de arriba.")

	if len(os.Args) != 2 || os.Args[1] != "--no-open" {
		go func() {
			if err := openBrowser(url); err != nil {
				fmt.Printf("No se pudo abrir el navegador predeterminado. Abri %s (%v).\n", url, err)
			}
		}()
	}
	return server.Serve(listener)
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v.\n", err)
		os.Exit(1)
	}
}
