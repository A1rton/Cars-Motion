# CarsMotion — Inicio

Página de inicio para una concesionaria premium, creada a partir del video de referencia y del logo y las seis imágenes entregados por el usuario.

La página incluye una presentación animada, imágenes superpuestas, una selección visual con filtros y ampliación de fotografías, cuatro bloques de marca y un cierre de contacto. Las animaciones acompañan el desplazamiento normal de la página.

**Solo está desarrollado el inicio.** Los botones **Nosotros**, **Autos** y **Contacto** muestran un aviso de próxima disponibilidad y están preparados para conectar sus futuras páginas. No hay inventario comercial, precios, reservas ni envío de consultas.

## Ver la página con doble clic

1. Descomprimí el ZIP completo.
2. Entrá en la carpeta `carsmotion-web`.
3. Hacé doble clic en **Abrir CarsMotion.cmd**.

Con Node.js 22.12 o posterior instalado, se abre el navegador con la página ya compilada. No hace falta instalar las dependencias para verla. Dejá abierta la ventana que aparece; al cerrarla, termina la vista local. La página queda disponible únicamente en tu computadora.

Si el navegador no se abre automáticamente, usá la dirección `http://127.0.0.1:4200/` que muestra esa ventana. Si aparece un aviso de puerto ocupado, cerrá la vista local anterior y volvé a abrir el archivo.

## Editar el proyecto

Instalá Node.js 22.12 o posterior. Abrí una terminal dentro de esta carpeta y ejecutá:

```sh
npm ci
npm run dev
```

Abrí la dirección local que aparece en la terminal. Para cerrar la vista local, presioná `Ctrl+C` en esa terminal.

## Preparar la versión final

```sh
npm run build
npm run preview
```

La carpeta `dist` contiene la versión preparada para un servidor de archivos estáticos. Debe abrirse mediante un servidor; no con doble clic en `dist/index.html`. Este proyecto no publica nada automáticamente.

## Continuar las páginas pendientes

Al comienzo de `src/main.js`, el objeto `pages` reúne los tres destinos. Cuando exista una página, asigná su dirección a `href`; todos sus botones usarán ese destino. Mientras `href` sea `null`, se conserva el aviso de próxima disponibilidad.

```js
autos: {
  title: 'Tu próximo auto está por llegar.',
  description: '…',
  href: './autos/'
}
```

En el mismo archivo, `brandPages` guarda un destino por emblema. Asigná su `href` cuando exista el catálogo de la marca. Mientras tanto, cada botón muestra un aviso con el nombre de la marca elegida.

## Archivos principales

| Archivo | Contenido |
| --- | --- |
| `index.html` | Contenido, navegación y estructura del inicio. |
| `Abrir CarsMotion.cmd` | Abre la versión compilada con doble clic en Windows. |
| `src/style.css` | Identidad visual y adaptación a distintas pantallas. |
| `src/main.js` | Animaciones, menú, filtros, imágenes ampliadas y destinos futuros. |
| `public/media/` | Recursos entregados por el usuario, optimizados para la web. |
| `public/media/sources.json` | Procedencia, tamaños y huellas de los recursos. |
| `docs/REFERENCES.md` | Referencia visual, decisiones de adaptación y licencias. |
| `docs/licenses/` | Avisos originales de las dependencias. |
| `docs/captures/` | Capturas reales guardadas durante la revisión. |
| `scripts/prepare-assets.py` | Exportación reproducible de las imágenes originales; requiere Pillow. |
| `scripts/package.ps1` | Creación y comprobación del ZIP de entrega. |
| `scripts/preview.mjs` | Servidor local de la versión compilada, sin dependencias externas. |

La revisión realizada y sus límites están documentados en [docs/VERIFICACION.md](docs/VERIFICACION.md). Las capturas incluyen vistas de móvil, tablet y escritorio.

## Movimiento y navegación

- Se respeta la opción de movimiento reducido del dispositivo.
- El pie permite pausar las animaciones cuando esa preferencia no está activa.
- El menú y las ventanas admiten teclado; `Escape` cierra la ventana o el menú abierto.
- Las flechas izquierda y derecha recorren las imágenes ampliadas.
- Los filtros ordenan imágenes de presentación; no consultan un catálogo de stock.

## Crear el ZIP

Después de compilar y finalizar la revisión:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package.ps1
```

El resultado es `CarsMotion-Web.zip`, en la carpeta superior. Incluye el código, los recursos, la compilación, la documentación y un listado de huellas SHA-256. El script comprueba cada archivo dentro del ZIP contra su original. Si ya existe un ZIP y querés reemplazarlo, agregá `-Force`.

No se incluyen `node_modules`, los archivos temporales de `.work` ni el video de referencia. Los proyectos anteriores permanecen separados.
