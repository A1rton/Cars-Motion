# Verificación de entrega

Fecha: 15 de noviembre de 2026.

## Resultado

Inicio terminado y compilado en `dist/`. Revisión en el navegador integrado, usando la versión compilada servida en `127.0.0.1:4195`. Se conservaron separados los proyectos anteriores.

## Comprobaciones realizadas

- Compilación de producción completada con Vite 8.3.8. Comprobación de sintaxis de los archivos JavaScript y del servidor local completada.
- La instalación de dependencias informó cero vulnerabilidades después de actualizar Vite.
- Portada y contenido revisados en anchos de 375, 390, 768, 1024, 1440 y 1920 píxeles. Sin desbordamiento horizontal observado. Se corrigió el encuadre de la foto principal en pantallas medianas.
- Recorrido completo capturado a 390 y 1440 píxeles. Las capturas de página completa se guardaron con las animaciones pausadas para mostrar todas las secciones.
- Logo y todas las fotografías de la página cargaron correctamente. La ampliación muestra la fotografía completa, sin deformación.
- Animaciones de entrada y desplazamiento comprobadas; las fotografías superpuestas cambian posición y rotación al recorrer la página.
- Pausar y reactivar animaciones comprobado; al pausar, los enlaces internos también dejan de usar desplazamiento animado.
- Filtro SUV: muestra solamente BMW. Todos: restablece las seis imágenes. Apertura de fotografía, avance a la siguiente y cierre con Escape comprobados.
- Botones Autos, Nosotros y Contacto: muestran sus avisos de próxima disponibilidad. Cierre con Escape y devolución del foco comprobados.
- Menú móvil: apertura, selección de Contacto, cierre del aviso y recuperación del desplazamiento comprobados.
- Revisión final del registro del navegador: sin errores ni advertencias capturados.
- Servidor local: portada, imágenes y archivos compilados respondieron correctamente. Los archivos fuente y `package.json` no se sirven; se comprobó el rechazo de una ruta que intenta salir de `dist`.
- Lanzador y documentación revisados. El ZIP se genera con comprobación de tamaño y SHA-256 de cada archivo incluido.

## Capturas

Las imágenes reales están en [captures](captures/): `inicio-375.jpg`, `inicio-390.jpg`, `inicio-768.jpg`, `inicio-1024.jpg`, `inicio-1440.jpg`, `inicio-1920.jpg`, `inicio-completo-390.jpg` e `inicio-completo-1440.jpg`.

## Alcance y límites

### Actualización de emblemas a color

Se reemplazaron los emblemas monocromáticos por Porsche dorado/rojo/negro, BMW azul/blanco, Mercedes-Benz plata y Alfa Romeo moderno a color. Lexus conserva su emblema negro original. El movimiento se aplica a la imagen mediante escala e inclinación según la posición del cursor. El área del botón permanece transparente y estática, sin borde ni pseudoelemento decorativo.

Se comprobó la compilación de producción, la apertura del aviso correspondiente en los cinco botones, el cierre con Escape, la pausa y reactivación del movimiento y la ausencia de errores en la sesión final de producción. Se revisó la franja a 390 px, con áreas táctiles de 59 × 68 px y sin desbordamiento horizontal. Capturas actualizadas en `captures/marcas-color.jpg` y `captures/marcas-color-movil.jpg`.

La revisión de tamaños se hizo en el navegador integrado; no equivale a pruebas en dispositivos físicos, Safari o Firefox. No se ejecutó Lighthouse ni una auditoría completa de accesibilidad o rendimiento. La preferencia de movimiento reducido del sistema está implementada y revisada en el código; se probó la pausa manual, sin cambiar preferencias del sistema operativo.

Solo se desarrolló el inicio. No hay páginas completas de Autos, Nosotros o Contacto, inventario real, precios, reservas ni envío de consultas. Las fotografías se usan como presentación visual. La entrega es local y no se publicó en Internet.
