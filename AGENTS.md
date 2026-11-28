# Trabajar en Cars Motion

Estas instrucciones rigen para las personas y las sesiones de Codex que trabajen en este repositorio. La entrega pública es una web estática que también se puede ejecutar en Windows desde el ZIP de GitHub, sin conexión y sin instalar Node.js.

## Arquitectura y áreas

| Área | Rama inicial | Alcance |
| --- | --- | --- |
| Frontend | `frontend/desarrollo` | Sitio público. `index.html` y `src/main.js` inicializan Inicio. `src/auto-routes.js` conecta el catálogo y las fichas. Los datos están en `src/catalog-data.js`, los favoritos en `src/favorites.js` y los recursos en `public/`. |
| Backend | `backend/desarrollo` | Espacio reservado en `backend/` para una futura API, persistencia y pruebas del servidor. El sitio actual funciona con datos locales. |
| Panel administrativo | `admin/desarrollo` | Espacio reservado en `admin/` para la interfaz interna y sus pruebas. El panel y su autenticación están pendientes de implementación. |

El frontend usa JavaScript con módulos ES, Vite, CSS, Inter local, GSAP con ScrollTrigger y Flip, y Swiper. El servidor portable en Go de `scripts/portable/` sirve la web estática. Los scripts Python reconstruyen y verifican la distribución. Consultá el README para ejecutar el proyecto.

Conservá la identidad visual de Inicio, sus animaciones, navegación por teclado y movimiento reducido. En Autos, mantené el fondo claro, los vehículos completos, la jerarquía marca/modelo y la adaptación a celular. Usá fotos y datos con procedencia conocida. Publicá precios, disponibilidad o especificaciones únicamente cuando estén confirmados. El ZIP debe seguir funcionando con recursos locales.

## Empezar una tarea

1. Cada integrante usa su propia cuenta de GitHub, su propia sesión de Codex y un clon independiente. El propietario concede acceso al repositorio a cada colaborador. Configurá tu nombre y correo de Git en tu clon. Mantené tokens, contraseñas y archivos de entorno fuera de Git.
2. Acordá en un issue el alcance, el área y quién lo toma. Si cambia un contrato entre áreas, describí allí los campos, ejemplos y comportamiento esperado antes de que ambas partes lo implementen.
3. Usá las tres ramas iniciales para las primeras tareas de cada área. Para trabajar en paralelo dentro de la misma área, cada tarea nueva sale de la última `origin/main` con su propio nombre. Por ejemplo:

   ```bash
   git fetch origin
   git switch -c frontend/filtro-marca origin/main
   ```

   Usá también prefijos `backend/` y `admin/`. Evitá que dos sesiones escriban en la misma rama o carpeta de trabajo. Cambios de herramientas, dependencias, contratos o archivos compartidos requieren coordinación con las áreas afectadas.

## Sincronizar y entregar

1. Revisá `git status` y `git diff`. Agregá por ruta solo lo correspondiente a la tarea. Creá un commit descriptivo y subí la rama con `git push -u origin HEAD`.
2. Para incorporar avances mientras trabajás, guardá tus cambios en la rama, ejecutá `git fetch origin` y luego `git merge origin/main`. Resolvé conflictos leyendo ambas versiones. Para el catálogo o Inicio, reconciliá primero las fuentes. Regenerá los compilados desde ese resultado.
3. Para cambios del sitio, usá Node 22 y ejecutá desde la raíz:

   ```bash
   npm ci
   python scripts/build-download.py
   python scripts/build-download.py --check
   ```

   Incluí en el commit las fuentes, `dist/`, `Abrir CarsMotion.cmd` y `SHA256SUMS.txt` que hayan cambiado. El verificador compara dos compilaciones. Ejecutá `python scripts/check-download.py --git` tras agregar los archivos. Para cambios visuales probá escritorio y móvil. Para documentación sola alcanza con revisar el diff y las comprobaciones del PR.
4. Abrí un Pull Request desde tu rama hacia `main`, vinculá el issue y completá la plantilla. Pedí revisión a otra persona, resolvé sus observaciones y esperá que pase **Download ZIP**: compilación reproducible y pruebas de archivo en Windows nativo, x86 y ARM. Si falla, corregí la causa en la misma rama.
5. Integrá mediante **Squash and merge** tras la aprobación. Evitá los pushes directos o forzados a `main`. Después de integrar, cada persona actualiza su clon con `git switch main` y `git pull --ff-only origin main`. La siguiente tarea parte de ese estado.

Para hacer obligatoria la revisión en GitHub, el administrador puede activar una regla para `main` en **Settings → Rules → Rulesets**, exigir Pull Request con una aprobación de otra persona, conversaciones resueltas y las cuatro comprobaciones de **Download ZIP**, y bloquear los pushes forzados.
