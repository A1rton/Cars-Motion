# Verificación de Code → Download ZIP

Fecha: 18 de noviembre de 2026.

## Diagnóstico del repositorio publicado

Se clonó `https://github.com/A1rton/cars-motion` y se descargó el ZIP automático de `main`, cuyo commit inicial de esta revisión era `9236526`.

El ZIP publicado contenía los tres ejecutables de `runtime/`, pero no `dist/index.html`: `.gitignore` excluía `dist/`. El lanzador se detenía por falta de la compilación. El README todavía pedía Node.js y el mensaje de error dirigía a otra distribución.

## Corrección

- Compilación de Vite incorporada a Git; sin cambios en `src/`, `public/` ni `index.html`.
- Inclusión explícita de `dist/` y `runtime/`, sin filtros LFS ni exclusión del archivo fuente.
- Lanzador guardado con CRLF en el propio contenido de Git, rutas entre comillas y selección de arquitectura, incluida `PROCESSOR_ARCHITEW6432`.
- Instrucciones para descargar, extraer y ejecutar desde el repositorio.
- Código fuente y reconstrucción reproducible de los servidores, y conservación de las licencias de redistribución.
- Verificador de archivos versionados, arquitecturas PE, recursos locales y SHA-256.
- Workflow de pruebas sobre el ZIP fuente descargado desde GitHub. No crea Releases ni otro ZIP de distribución.

## Evidencia local

- `npm ci` y `npm run build` completados. `dist/` coincide byte por byte con la compilación del ZIP portable adjunto.
- Los tres servidores se recompilaron con Go 1.27.4, `CGO_ENABLED=0`, sin descargar módulos, y coincidieron byte por byte con los binarios versionados. Las licencias de Go y sus bibliotecas incluidas también coincidieron.
- Cabeceras PE verificadas: x64 `0x8664`, x86 `0x014c`, ARM64 `0xaa64`, Windows mínimo 10.0. Destinos de Go y ausencia de CGO verificados.
- Los 51 archivos de ejecución quedaron agregados a Git sin `git add -f`. El verificador comprobó las reglas de ignore, filtros, atributos del archivo fuente, CRLF y SHA-256. El ZIP original descargado de GitHub fue rechazado correctamente por falta de `dist/`.
- Se creó un archivo de prueba con `git archive` a partir del árbol de Git y se extrajo en una carpeta nueva. Se verificaron sus archivos, sin copiar dependencias de desarrollo. Es una prueba local del contenido versionado; no se presenta como una descarga del commit corregido desde GitHub.
- Una compilación Linux del mismo servidor atendió todos los archivos de `dist/` con SHA-256 coincidente, desde una carpeta de trabajo diferente y con PATH vacío de herramientas. Se verificaron HEAD, rechazo de POST, directorios, rutas que salen de `dist` y Host ajeno. Esto comprueba el servidor, no los ejecutables de Windows.
- Vista de producción en el navegador: imágenes cargadas, cinco filtros con sus cantidades esperadas, cinco marcas, cuatro avisos de navegación, seis imágenes ampliadas, cierre de ventana y pausa/reactivación del movimiento. Se usó una copia exacta del `dist` extraído. No se modificó el diseño.

## Publicación y pruebas nativas

Al preparar esta revisión, la publicación del commit y el workflow de Windows estaban pendientes. GitHub figuraba conectado, pero la sesión de trabajo no disponía de herramientas autenticadas de escritura. No se considera completada la verificación obligatoria mientras no se publique y se pruebe el ZIP generado por GitHub.

## Límites

Las pruebas realizadas en Linux no equivalen a ejecutar un `.cmd` en Windows. La comprobación nativa x64, x86 sobre Windows x64 y ARM64, y la descarga del ZIP del commit corregido, deben quedar respaldadas por una ejecución exitosa del workflow después de publicar el commit. La matriz no incluye una instalación nativa de Windows 10 de 32 bits.

La página conserva sus funciones existentes y sus avisos de próxima disponibilidad; la distribución portable no agrega un backend de cuentas o ventas.
