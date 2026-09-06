# ¿La hizo una IA?

Juego de percepción: 34 imágenes, una por una — ¿fotografía real o imagen generada por IA?
Al terminar, el jugador recibe una nota de 0 a 100 y una comparación **anónima** contra el
acumulado de todos los participantes (promedio global, percentil aproximado y distribución).

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app (UI + lógica). Sitio 100 % estático, sin build. |
| `items.js` | Banco de 34 imágenes embebidas en base64 (`{id, src, real}`). |
| `items-r1.js` | Miniaturas e ids de las 20 imágenes de la ronda 1, congelados. |
| `panel.css` · `panel.js` | Código común de los dos paneles. |
| `og.png` | Imagen de vista previa para LinkedIn (1200×630). |
| `creditos.html` | Créditos de las fotografías (⚠️ atribuciones individuales pendientes). |
| `vercel.json` | Config mínima para Vercel (estático, sin framework). |

## Qué muestra al terminar

La nota, un comentario, los aciertos y tres números con una línea. Nada más.

### El comentario: solo dos, según un umbral estadístico

| Nota | Mensaje |
|---|---|
| **menos de 67** | «Parece que la tecnología aplicada por Final Edge ha llegado a un punto en el que te es difícil identificar las imágenes hechas con IA de las imágenes fotográficas reales.» |
| **67 o más** | «Felicidades. Al parecer aún tenemos que esforzarnos más para crear imágenes que logren confundirse con la realidad.» |

El corte no es arbitrario. Con 16 fotos reales y 18 imágenes de IA, y bajo la hipótesis de
que la persona no distingue (sus respuestas son independientes de la verdad), la nota tiene
media 50. Alcanzar **67** por puro azar tiene una probabilidad del **4,55 %** con la
estrategia más favorable al azar. Constante `UMBRAL` en `index.html`; con α = 0,01 sería 73.

El peor caso se calcula así: quien no distingue elige un número fijo *k* de imágenes para
señalar como IA, y cuántas de ellas lo son de verdad sigue una hipergeométrica. Se toma el
*k* que más probabilidad da de superar el corte.

> **Corrección.** La primera ronda usó 66 documentado como «4,65 %». Esa cifra salía de
> modelar que la persona contesta cada imagen a cara o cruz con probabilidad fija, que es una
> *mezcla* del caso anterior y por tanto nunca puede ser el peor caso. El peor caso real de 66
> con 10/20 era **7,71 %** (señalando IA en 16 de las 30), no 4,65 %: el corte era más laxo de
> lo que declaraba. Con el mismo criterio, 10/20 habría necesitado 69.

### Los tres números

| | Qué es | De dónde sale |
|---|---|---|
| **Tu promedio** | media de todas tus partidas | `localStorage` de tu navegador |
| **Tus partidas** | cuántas has terminado | `localStorage` de tu navegador |
| **Promedio global** | media de todas las partidas de todos | contadores públicos |

## Dos rondas

| | Ronda 1 (cerrada) | Ronda 2 (en curso) |
|---|---|---|
| Banco | 10 fotos + 20 de IA | 16 fotos + 18 de IA |
| Umbral | 66 | 67 |
| Namespace | `lahizounaia-v3-vrk10b` | `lahizounaia-r2-t7m4qp` |
| Panel | `panel-9009ly4u2c2h8y.html` | `panel-2nd-v3lbdhr2i0kg.html` |

Cada ronda tiene **namespace propio**: cambiar el banco cambia la dificultad, así que mezclar
promedios entre rondas no significaría nada. Los contadores de la ronda 1 quedan congelados
porque el juego ya no escribe en ellos.

`items-r1.js` guarda miniaturas e ids de las 20 imágenes de la ronda 1 (135 KB) para que su
panel siga funcionando sin arrastrar el banco completo.

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

Cada panel lista las imágenes generadas de su ronda con el porcentaje de gente que
señaló cada una como hecha con IA, de la más convincente a la más delatada.

- Cada imagen lleva un **id de contenido** (SHA-256 de sus bytes, 10 hex) guardado en `items.js`.
  Si se sustituye una imagen su id cambia solo y sus estadísticas arrancan de cero; reordenar
  el banco no afecta a nada.
- Al terminar, el navegador incrementa `i<id>` por cada imagen generada que la persona señaló
  como IA, más `runs`.
- El divisor es **`runs`**, no el total histórico de partidas: cuando se añadió este registro ya
  había partidas contadas sin datos por imagen, y usarlas daría porcentajes falsos. Como cada
  partida muestra las 34 imágenes, toda partida contada expone cada imagen exactamente una vez.

### El límite de peticiones obliga a hacer cola

Terminar una partida necesita hasta 39 peticiones (20 para leer el promedio global, 19 para
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

- [x] Meta `og:image` con URL absoluta (hecho: `og.png`).
- [ ] Completar las atribuciones individuales en `creditos.html` antes de difundir.
- [ ] Confirmar los derechos de las 6 fotografías aportadas por Final Edge en la ronda 2.
