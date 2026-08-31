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

## Cómo funciona el acumulado anónimo

- Al terminar una partida, el navegador incrementa **un contador público** correspondiente
  al tramo de la nota final (`b0`…`b10`, tramos de 10 puntos) en
  [Abacus](https://abacus.jasoncameron.dev) — un servicio de contadores sin llaves ni cuenta.
- **No se envía ningún dato personal**: ni nombre, ni correo, ni IP (el sitio no la guarda;
  Abacus solo aplica rate-limit). Lo único transmitido es "una persona más en el tramo X".
- **Cada partida terminada suma**, incluidas las repeticiones desde el mismo navegador; por eso
  el total se etiqueta como *partidas jugadas*, no como personas.
- El promedio y el percentil se calculan a partir de los tramos, por eso se muestran con `~`.
- La gráfica dibuja los 11 tramos con una columna de fondo siempre visible, el eje etiquetado
  de 0 a 100 y la altura de la barra más alta indicada, para que la escala se entienda.

### Namespace

Los contadores viven en el namespace `lahizounaia-v1-vrk10b`. Para **probar sin ensuciar
los datos reales**, abre la página con `?ns=cualquier-cosa`. Para **resetear el acumulado**
antes del lanzamiento, cambia el sufijo del namespace en `index.html` (constante `AGG_NS`).

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
