# ¿La hizo una IA?

Juego de percepción: 30 imágenes, una por una — ¿fotografía real o imagen generada por IA?
Al terminar, el jugador recibe una nota de 0 a 100 y una comparación **anónima** contra el
acumulado de todos los participantes (promedio global, percentil aproximado y distribución).

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app (UI + lógica). Sitio 100 % estático, sin build. |
| `items.js` | Banco de 30 imágenes embebidas en base64 (`{src, real}`). |
| `creditos.html` | Créditos de las fotografías (⚠️ atribuciones individuales pendientes). |
| `vercel.json` | Config mínima para Vercel (estático, sin framework). |

## Qué muestra al terminar

Tres números y una línea:

| | Qué es | De dónde sale |
|---|---|---|
| **Tu promedio** | media de todas tus partidas | `localStorage` de tu navegador |
| **Tus partidas** | cuántas has terminado | `localStorage` de tu navegador |
| **Promedio global** | media de todas las partidas de todos | contadores públicos |

La línea de 0 a 100 marca esos dos promedios: el tuyo arriba, el global abajo.

## Cómo funciona el acumulado anónimo

- Al terminar, el navegador incrementa contadores públicos en
  [Abacus](https://abacus.jasoncameron.dev) (servicio sin llaves ni cuenta): uno para la
  **decena** de la nota (`b00`…`b10`) y otro para su **unidad** (`u01`…`u09`).
- Con esas dos piezas el promedio global es **exacto**, no una estimación:
  `suma = 10·Σ(decena × partidas) + Σ(unidad × veces)`. Hace falta porque el servicio solo
  sabe sumar de uno en uno (`/set` y `/update` exigen clave de administrador, que no puede
  vivir en el cliente).
- **No se envía ningún dato personal**: ni nombre, ni correo, ni IP. Solo "una partida más
  con esta nota".
- **Cada partida terminada suma**, incluidas las repeticiones.
- Tus propios números no salen de tu navegador.

### Límite conocido

Los contadores de Abacus son públicos: cualquiera que conozca el namespace podría inflarlos.
Para un juego de LinkedIn es un riesgo aceptable; si algún día se necesita algo blindado,
el reemplazo natural es una función serverless + KV (p. ej. Upstash) manteniendo el mismo
esquema de tramos.

## Deploy en Vercel

El sitio es estático puro — no hay build ni variables de entorno. El repo ya está
conectado al proyecto `test-ai-images` de Vercel: cada push a `main` despliega
producción automáticamente y cada PR genera un preview.

Nota: si producción muestra `404 NOT_FOUND`, es que `main` aún no contiene la app
(solo el README semilla) — hay que mergear el PR con `index.html`.

Después del primer deploy con la app:

- [ ] Añadir en `index.html` la meta `og:image` con URL absoluta del dominio final
      (LinkedIn la exige para mostrar imagen en el post).
- [ ] Completar las atribuciones en `creditos.html` antes de difundir.
