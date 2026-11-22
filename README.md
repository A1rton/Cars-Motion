# CarsMotion

## Abrir en Windows

1. Entrá a [este repositorio](https://github.com/A1rton/cars-motion) y elegí **Code → Download ZIP**.
2. En el archivo descargado, elegí **Extraer todo**.
3. Abrí la carpeta extraída y hacé doble clic en **Abrir CarsMotion.cmd**.

La página se abre en tu navegador predeterminado. **No necesitás instalar Node.js, npm ni Go, compilar nada o tener Internet después de descargar el ZIP.** Dejá abierta la ventana de CarsMotion mientras lo uses; cerrala para detener el servidor.

Si el navegador no se abre, copiá la dirección `http://127.0.0.1:PUERTO/` que aparece en esa ventana. El puerto se elige automáticamente. No abras `dist/index.html` directamente ni ejecutes el lanzador desde dentro del ZIP.

Conservá juntos `Abrir CarsMotion.cmd`, `dist/` y `runtime/`. Si faltan archivos, volvé a descargar con **Code → Download ZIP** y extraé todo.

### Compatibilidad

Se necesita Windows y un navegador moderno ya instalado, como Microsoft Edge.

| Windows | Servidor incluido |
| --- | --- |
| Windows 10 u 11, Intel/AMD de 64 bits | `runtime/CarsMotion-x64.exe` |
| Windows 10 u 11, ARM64 | `runtime/CarsMotion-arm64.exe` |
| Windows 10 de 32 bits, procesador con SSE2 | `runtime/CarsMotion-x86.exe` |

El lanzador elige la arquitectura automáticamente, incluso desde un proceso de 32 bits en Windows de 64 bits. Windows 11 no tiene edición x86 de 32 bits. No se admite Windows 7/8. El servidor solo escucha en tu computadora (`127.0.0.1`) y usa las DLL incluidas en Windows. Los avisos de redistribución están en `licencias/`.

### Qué incluye la página

La franja de marcas permite recorrer nueve emblemas con las flechas laterales o deslizando en una pantalla táctil. Cada emblema abre el aviso de su marca. El inicio también incluye un menú adaptable, filtros, ampliación de fotografías y un control para pausar las animaciones. Imágenes, fuentes y JavaScript están incluidos localmente.

**Está desarrollado el inicio.** Autos, Nosotros, Contacto, las marcas e Iniciar sesión muestran los avisos de próxima disponibilidad que ya tenía el proyecto. No hay cuentas reales, inventario comercial, reservas ni envío de consultas.

## Editar el código (solo para desarrolladores)

Los archivos editables siguen en `index.html`, `src/`, `public/` y `vite.config.js`. Para editarlos necesitás Node.js 22.12 o posterior:

```sh
npm ci
npm run dev
```

Antes de publicar cambios en el diseño, regenerá y **agregá la compilación al mismo commit**. Python 3 se usa solamente para las verificaciones de mantenimiento:

```sh
python scripts/build-download.py
git add dist SHA256SUMS.txt
python scripts/check-download.py --git
git commit
git push
```

GitHub incluye los archivos del commit de la rama seleccionada al descargar. Por eso `dist/`, `runtime/`, `licencias/` y el lanzador se guardan directamente en Git, sin Git LFS. `node_modules/` y `.work/` quedan excluidos. No hay un paso de instalación en el equipo del visitante.

### Servidor portable y pruebas

El código del servidor está en `scripts/portable/`. Resuelve `dist` desde la ubicación del ejecutable, independientemente de la carpeta de trabajo. Para regenerar los tres ejecutables, el mantenedor necesita Go **1.27.4**:

```sh
python scripts/build-runtime.py
python scripts/check-download.py --refresh
git add runtime licencias SHA256SUMS.txt
python scripts/check-download.py --git
```

`python scripts/build-runtime.py --check` recompila en una carpeta temporal y compara los tres binarios y las licencias, sin sobrescribirlos.

La comprobación **Download ZIP** en GitHub Actions verifica la inclusión en Git, recompila la página para detectar un `dist` desactualizado, descarga el archivo fuente del commit desde GitHub y ejecuta el lanzador desde una extracción nueva. Prueba x64, x86 sobre Windows x64 y ARM64 nativo; el proceso de CarsMotion no tiene Node.js en su PATH. Las pruebas de navegador x64 bloquean las solicitudes que no sean locales.

La ejecución de esas pruebas requiere publicar el commit y que GitHub Actions esté habilitado. Su existencia no implica que hayan pasado. Consultá el registro de [verificación](docs/VERIFICACION-DOWNLOAD-ZIP.md) para distinguir las pruebas realizadas de las pendientes.
