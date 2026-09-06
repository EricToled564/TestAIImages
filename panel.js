/* Lógica compartida por los paneles de las dos rondas.
   Cada página define antes:
     RONDA = { ns, imagenes: [{id, src}], cerrada: bool } */
var BASE='https://abacus.jasoncameron.dev';
var NS=(function(){try{return new URLSearchParams(location.search).get('ns')||RONDA.ns;}
        catch(e){return RONDA.ns;}})();
function $(id){return document.getElementById(id);}

/* Ventana deslizante: el servicio corta a 30 peticiones cada 10 s por IP y aquí
   se leen tantos contadores como imágenes tenga la ronda, más uno. */
var CUPO=25, envios=[], cola=[];
function bombear(){
  var lim=Date.now()-10000;
  while(envios.length && envios[0]<=lim) envios.shift();
  while(cola.length && envios.length<CUPO){ envios.push(Date.now()); cola.shift()(); }
  if(cola.length) setTimeout(bombear, Math.max(50, envios[0]+10000-Date.now()+50));
}
function pedir(url){
  return new Promise(function(res,rej){
    cola.push(function(){ fetch(url).then(res,rej); });
    bombear();
  });
}
var hechas=0, totales=0;
function get(key){
  return pedir(BASE+'/get/'+NS+'/'+key).then(function(r){
    hechas++; $('cargaI').style.width=Math.round(hechas/totales*100)+'%';
    if(r.status===404) return 0;                 /* contador aún sin crear */
    if(!r.ok) throw new Error('get '+r.status);
    return r.json().then(function(j){return j.value||0;});
  });
}

/* Escala continua: reconocimiento bajo = verde, alto = rojo. Sin escalones,
   para que no haya una franja ambigua justo donde caen casi todos los datos.
   El 50% —contestar al azar— queda en amarillo, y de ahí al rojo va curvado:
   con un reparto lineal, un 79% todavía se veía naranja. Luminosidad 64% para
   que cualquier tono del recorrido pase el mínimo de contraste sobre negro. */
function tono(pct){
  var p=Math.max(0,Math.min(100,pct)), h, s=62;
  if(p<=50){ h=142-82*(p/50); }
  else{ var t=(p-50)/50; h=60*(1-t)*(1-t); s=62+16*t; }
  return 'hsl('+Math.round(h)+','+Math.round(s)+'%,64%)';
}

function cargar(){
  $('estado').hidden=false; $('estado').textContent='Leyendo contadores…';
  $('tabla').hidden=true; $('carga').hidden=false;
  hechas=0; totales=RONDA.imagenes.length+1; $('cargaI').style.width='0%';

  var tareas=[get('runs')];
  for(var i=0;i<RONDA.imagenes.length;i++) tareas.push(get('i'+RONDA.imagenes[i].id));

  Promise.all(tareas).then(function(v){
    $('carga').hidden=true;
    pintar(v[0], v.slice(1));
  })['catch'](function(e){
    $('carga').hidden=true;
    $('estado').textContent='No se pudieron leer los contadores ('+e.message+'). Reintenta en unos segundos.';
  });
}

function pintar(runs, cuentas){
  $('runs').textContent=runs.toLocaleString('es-MX');

  if(runs<1){
    $('estado').hidden=false;
    $('estado').textContent=RONDA.cerrada
      ? 'Esta ronda cerró sin partidas medidas.'
      : 'Todavía no hay partidas medidas. En cuanto alguien termine una partida aparecerán aquí.';
    $('nota').innerHTML='El contador de esta ronda es <b>independiente</b>: empieza en cero a propósito, para no mezclarse con la anterior.';
    $('aviso-muestra').textContent='';
    return;
  }
  $('estado').hidden=true;

  var filas=RONDA.imagenes.map(function(it,i){
    return {it:it, vistas:cuentas[i], pct:cuentas[i]/runs*100};
  });
  filas.sort(function(a,b){return a.pct-b.pct;});   /* la más convincente arriba */

  var suma=filas.reduce(function(s,f){return s+f.pct;},0);
  $('prom').textContent=Math.round(suma/filas.length)+'%';
  $('mejor').textContent=Math.round(filas[0].pct)+'%';
  $('peor').textContent=Math.round(filas[filas.length-1].pct)+'%';

  var html='';
  filas.forEach(function(f,n){
    var pct=f.pct, color=tono(pct);
    html+='<tr>'
      + '<td class="pos">'+(n+1)+'</td>'
      + '<td class="mini"><img src="'+f.it.src+'" alt=""></td>'
      + '<td><span class="mono">'+f.it.id+'</span></td>'
      + '<td class="n"><div class="pct" style="color:'+color+'">'+pct.toFixed(1)+'%</div>'
        + '<div class="sub">'+f.vistas.toLocaleString('es-MX')+' de '+runs.toLocaleString('es-MX')+'</div></td>'
      + '<td class="n"><div class="pct">'+(100-pct).toFixed(1)+'%</div></td>'
      + '<td class="medida"><div class="riel"><i style="width:'+Math.min(100,pct).toFixed(1)
        + '%;background:'+color+'"></i><u></u></div></td>'
      + '</tr>';
  });
  $('filas').innerHTML=html;
  $('tabla').hidden=false;

  var bajo50=filas.filter(function(f){return f.pct<50;}).length;
  $('nota').innerHTML='<b>'+bajo50+' de '+filas.length+'</b> imágenes engañan a más de la mitad de quienes las ven.';

  /* Margen de error de una proporción al 95%: 1,96·sqrt(0,25/n) en el peor caso. */
  var margen=1.96*Math.sqrt(0.25/runs)*100;
  $('aviso-muestra').innerHTML= runs<30
    ? '<b>Muestra pequeña ('+runs+' partidas).</b> Con tan pocos datos cada porcentaje se mueve hasta ±'
      + margen.toFixed(0) + ' puntos. Sirve para ver la tendencia, no para presumir cifras.'
    : 'Con '+runs.toLocaleString('es-MX')+' partidas, cada porcentaje tiene un margen de ±'
      + margen.toFixed(1) + ' puntos (95% de confianza).';
}

$('recargar').onclick=cargar;
cargar();
