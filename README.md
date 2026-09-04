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

La nota, un comentario, los aciertos y tres números con una línea. Nada más.

### El comentario: solo dos, según un umbral estadístico

| Nota | Mensaje |
|---|---|
| **menos de 66** | «Parece que la tecnología aplicada por Final Edge ha llegado a un punto en el que te es difícil identificar las imágenes hechas con IA de las imágenes fotográficas reales.» |
| **66 o más** | «Felicidades. Al parecer aún tenemos que esforzarnos más para crear imágenes que logren confundirse con la realidad.» |

El corte no es arbitrario. Con 10 fotos reales y 20 imágenes de IA, y bajo la hipótesis de
que la persona no distingue (sus respuestas son independientes de la verdad, con cualquier
estrategia — incluso contestar siempre lo mismo), la nota tiene media 50. Alcanzar **66**
por puro azar tiene una probabilidad del **4,65 %** con la estrategia más favorable al azar,
es decir, el corte del 5 % de una cola para este diseño. Constante `UMBRAL` en `index.html`;
con α = 0,01 el corte sería 73.

### Los tres números

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

## Panel por imagen

`panel-9009ly4u2c2h8y.html` lista las 20 imágenes generadas con el porcentaje de gente que
señaló cada una como hecha con IA, de la más convincente a la más delatada.

- Cada imagen lleva un **id de contenido** (SHA-256 de sus bytes, 10 hex) guardado en `items.js`.
  Si se sustituye una imagen su id cambia solo y sus estadísticas arrancan de cero; reordenar
  el banco no afecta a nada.
- Al terminar, el navegador incrementa `i<id>` por cada imagen generada que la persona señaló
  como IA, más `runs`.
- El divisor es **`runs`**, no el total histórico de partidas: cuando se añadió este registro ya
  había partidas contadas sin datos por imagen, y usarlas daría porcentajes falsos. Como cada
  partida muestra las 30 imágenes, toda partida contada expone cada imagen exactamente una vez.

### El límite de peticiones obliga a hacer cola

Terminar una partida necesita hasta 41 peticiones (20 para leer el promedio global, 21 para
registrar la partida imagen por imagen) y el servicio corta a 30 cada 10 s por IP. Ambas páginas
usan una **ventana deslizante** de 25: se cuentan los envíos de los últimos 10 s y no se pasa de
ahí. Un cubo de fichas no sirve — arrancando lleno y reponiéndose deja pasar el doble del cupo
en la primera ventana (medido: 41). Las lecturas que la persona está esperando se encolan con
prioridad; las escrituras drenan detrás en unos 10 s. Si cierra la pestaña antes, se pierden las
que falten.

### Límite conocido

Los contadores de Abacus son públicos: cualquiera que conozca el namespace podría inflarlos
o leerlos. El namespace vive en el código del cliente, que es público, así que **el panel no
es privado en sentido estricto**: su nombre de archivo no está enlazado ni indexado, pero el
repositorio es público y las cifras son legibles por cualquiera que lea el fuente. Es
oscuridad, no control de acceso.

Para un juego de LinkedIn es un riesgo aceptable. Si hiciera falta algo blindado —datos que
nadie más pueda leer ni inflar— el reemplazo natural es una función serverless + KV
(p. ej. Vercel KV o Upstash) con la clave en variable de entorno y el panel detrás de
autenticación, manteniendo el mismo esquema de contadores.

Las claves caducan a los **6 meses sin accesos**; cada lectura o escritura reinicia el plazo,
así que mientras el juego tenga tráfico no expiran.

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
