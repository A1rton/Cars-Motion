# Referencias y recursos — CarsMotion Inicio

## Encargo vigente

Este proyecto corresponde al nuevo inicio solicitado el 15 de noviembre de 2026. Sustituye el trabajo anterior como dirección de diseño. No continúa la escena 3D ni la colección de `cars-motion-next`.

Se desarrolla únicamente la página de inicio. **Nosotros**, **Autos** y **Contacto** son destinos reservados para una etapa posterior.

## Video de referencia

Archivo aportado por el usuario: `Recording 2026-11-15 000845.mp4`.

- Duración observada: aproximadamente 13,1 segundos.
- Dimensiones del video: 480 × 366 píxeles.
- Identidad visible de la referencia: “Unique”. No se proporcionó URL, autoría ni código fuente de ese sitio.
- El video se estudió mediante fotogramas de su secuencia. No se distribuye dentro del proyecto ni se reproduce como fondo del sitio.

La referencia se usa para estudiar composición y movimiento. **No se afirma que su código o sus recursos tengan una licencia de reutilización.** No se copió el código de ese sitio ni sus fotografías, teléfonos o logotipos.

### Elementos trasladados a CarsMotion

| Referencia observada | Adaptación del inicio |
| --- | --- |
| Superficie blanca amplia sobre un marco gris con bordes suaves. | Contenedor blanco, fondo neutro y esquinas redondeadas. |
| Navegación estable en la parte superior. | Encabezado que acompaña el recorrido y menú propio para móvil. |
| Titular negro a la izquierda y automóvil protagonista a la derecha. | Presentación con titular en español y Porsche al atardecer entregado por el usuario. |
| Dos objetos superpuestos e inclinados que entran a distinta velocidad. | Dos marcos fotográficos con desplazamiento e inclinación moderados. |
| Categorías pequeñas y fotografías que aparecen por etapas. | Selección visual de seis imágenes, filtros y entrada escalonada. |
| Cuatro bloques con desfase vertical. | Cuatro aspectos de la identidad CarsMotion con entradas progresivas. |
| Panel oscuro de cierre con botón claro. | Cierre fotográfico oscuro con una llamada a la futura página de contacto. |

El movimiento se implementó con GSAP y ScrollTrigger, sin capturar globalmente la rueda del mouse. No se presentan fotografías como si fueran modelos tridimensionales.

## Recursos entregados por el usuario

Los siguientes archivos fueron proporcionados para este encargo. Su procedencia se conserva como **material aportado por el usuario**, sin asignarles una licencia abierta ni atribuir una autoría no acreditada.

| Recurso original | Uso |
| --- | --- |
| `Chrome CarsMotion Sports Car Logo.png` | Identidad de la cabecera y del pie. |
| `Winter Mustang on Manhattan’s Wet Streets.png` | Selección visual y cierre del inicio. |
| `Silver Porsche on a Misty Alpine Road.png` | Composición superpuesta y selección visual. |
| `Lexus LS 300h Along the Rainy Coast.png` | Selección visual. |
| `BMW SUV on a Rainy City Road.png` | Selección visual. |
| `Mercedes A200 on a Misty Mountain Road.png` | Composición superpuesta y selección visual. |
| `Sunset Porsche on Mountain Roads.png` | Presentación principal y selección visual. |

Las fotografías se exportaron a WebP a 800 y 1600 píxeles de ancho, manteniendo su proporción. No se retocaron ni se alteró la perspectiva de los automóviles. Los marcos de la interfaz usan encuadres adaptados a cada pantalla; la vista ampliada permite observar la imagen completa. El logo WebP conserva la transparencia y también se incluye el PNG original sin cambios.

`public/media/sources.json` registra nombres originales, dimensiones y SHA-256 de originales y variantes. `scripts/prepare-assets.py` permite repetir la conversión con los archivos originales y Pillow.

Los nombres de archivo se conservan como procedencia; **no verifican una versión, motorización o ficha técnica**. Las imágenes son de presentación y no acreditan unidades disponibles. No se publican precios, financiación, ubicación, trayectoria comercial ni testimonios inventados.

Las marcas de vehículos pertenecen a sus respectivos titulares. Su mención no representa una afiliación o concesión oficial declarada.

## Implementación y dependencias

| Recurso | Versión fijada | Aplicación y aviso |
| --- | --- | --- |
| [GSAP](https://gsap.com/) | 3.15.0 | Secuencias, ScrollTrigger y Flip para redistribuir filtros. El paquete declara [GSAP Standard License](https://gsap.com/standard-license/); no se presenta como MIT. Se conservan `licenses/GSAP-package.json` y `licenses/GSAP-README.md`. |
| [Inter](https://rsms.me/inter/), distribuida por [Fontsource](https://fontsource.org/fonts/inter) | `@fontsource-variable/inter` 5.3.0 | Tipografía alojada en el propio proyecto. SIL Open Font License; texto conservado en `licenses/Inter-OFL.txt`. |
| [Vite](https://vite.dev/) | 8.3.8 | Desarrollo y compilación. Aviso MIT y avisos de terceros conservados en `licenses/Vite-LICENSE.md`. |

La estructura y los estilos de este inicio se implementaron para el nuevo encargo a partir de la observación del video. No se integró código de APEX Stradale, Codrops ni de los proyectos Cars Motion anteriores.

## Alcance y límites

- Solo existe el inicio; los tres destinos futuros muestran un aviso y usan un mapa de URLs centralizado en `src/main.js`.
- La selección es visual, con filtros y ampliación; no es un inventario ni una página de detalle comercial.
- No hay formularios de envío, servicios externos, cuentas, pagos ni analítica incorporada.
- No hay modelo 3D ni una aplicación móvil; los marcos superpuestos contienen las imágenes entregadas.
- El video muestra escritorio. La composición móvil es una adaptación propia que conserva el recorrido y reduce la densidad.
- La compilación y la revisión visual son comprobaciones distintas. Los resultados reales de navegador deben consultarse en el informe de verificación de esta entrega.
## Emblemas de la franja de marcas

- Porsche: emblema vectorial a color de [Cardog Icons Core 1.2.0](https://registry.npmjs.org/@cardog-icons/core/-/core-1.2.0.tgz), archivo `optimized/Porsche Icon.svg`. Se ajustó únicamente el viewBox para quitar espacio vacío. Licencia incluida en `licenses/Cardog-LICENSE.txt`.
- Alfa Romeo: PNG transparente de 480 × 480 con el emblema moderno, tomado de la página oficial [The Badge](https://alfaromeo.co.nz/the-badge). [Archivo original](https://alfaromeo.co.nz/image_file/xlogopagespeedicy5m4s7uyif-ynou2.png).
- Mercedes-Benz y BMW: versiones plata y azul/blanco de [Car Logos SVG](https://github.com/diegojasso/car-logos-SVG/tree/main/logos), archivos `mercedes-benz.svg` y `bmw.svg`.
- Lexus: se aisló el emblema ovalado del [SVG de Lexus en Car Logos SVG](https://github.com/diegojasso/car-logos-SVG/blob/main/logos/lexus.svg) sin alterar su trazado.

