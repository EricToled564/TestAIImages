# Buzón para las 20 imágenes nuevas

Aquí van las 20 imágenes hechas con IA que sustituyen a las 20 actuales del juego.

## Cómo subirlas

1. Estando en esta carpeta, arriba a la derecha: **Add file → Upload files**
2. Arrastra las 20 imágenes
3. Abajo del todo: **Commit changes**

Nómbralas `ia-01`, `ia-02` … `ia-20`. Cualquier formato (PNG, JPG, WEBP) y cualquier tamaño:
se convierten después a 820 px de lado mayor en WEBP, que es el estándar del banco actual.

## Qué pasa después

Las 20 se incrustan en `items.js` en lugar de las actuales de IA, se conservan las 10
fotografías reales, y esta carpeta se borra — las imágenes viajan dentro de `items.js`,
no como archivos sueltos.

El umbral estadístico del juego sigue en 66, porque la mezcla no cambia: 10 reales + 20 de IA.
El contador global se reinicia, porque las partidas del banco anterior no son comparables.
