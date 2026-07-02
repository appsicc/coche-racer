# Juego Coches Realista V66 Perfil de Piloto

Este proyecto une:
- coches GLB
- mapas GLB
- garaje
- selector de circuitos
- conducción base
- nitro
- monedas
- obstáculos
- controles PC y móvil
- checkpoints
- 3 vueltas
- cronómetro
- récord local
- minimapa simple

## Cómo probar
1. Descomprime el ZIP.
2. Abre `index.html` en Chrome, Edge o Firefox.
3. Elige coche en Garaje.
4. Elige circuito en Circuitos.
5. Pulsa Jugar.

## Controles PC
- W / Flecha arriba: acelerar
- S / Flecha abajo: frenar
- A / Flecha izquierda: girar izquierda
- D / Flecha derecha: girar derecha
- Espacio: nitro
- Escape: pausa

## Controles móvil
Usa los botones de pantalla.

## Dónde están los modelos
Coches:
assets/models/cars/

Mapas:
assets/models/maps/

## Cómo añadir otro coche
1. Mete el nuevo `.glb` en:
   assets/models/cars/
2. Añádelo en `manifest.json` dentro de `cars`.
3. Indica nombre, archivo y estadísticas.

## Nota importante
Los coches son inspirados en marcas, pero no llevan logos oficiales. Para publicar un juego, usa nombres inventados y evita marcas registradas si no tienes licencia.

## Próximas mejoras
- físicas más realistas con suspensión
- carretera con curvas reales
- checkpoints
- vueltas y cronómetro
- tráfico
- garaje más visual
- sonidos reales mp3/ogg


## Novedades V2
- Carrera de 3 vueltas.
- Checkpoints visibles en pista.
- Cronómetro en HUD.
- Récord local por coche + mapa.
- Pantalla de resultado al terminar.
- Minimap simple.


## Novedades V3
- 3 rivales IA.
- Posición en carrera.
- Cuenta atrás 3, 2, 1, GO.
- Resultado con posición final.
- Guías visuales de trazado curvo sobre la pista.
- Mejor sensación de carrera competitiva.


## Novedades V4
- Circuito curvo real generado por puntos.
- Carretera con segmentos que siguen el trazado.
- Checkpoints colocados sobre la curva.
- Rivales IA siguiendo el trazado curvo.
- Penalización si sales de la pista.
- HUD con estado “En pista / Fuera de pista”.
- Minimap usando progreso real del circuito.


## Novedades V5
- Menú de ajustes.
- Calidad gráfica baja, media y alta.
- Ajustes guardados en localStorage.
- Sonido activable/desactivable.
- Sombras optimizadas según calidad.
- Partículas reducidas en baja calidad.
- Mejor pensado para móvil y PC.

## Recomendación
- Móvil: calidad Baja.
- PC normal: calidad Media.
- PC potente: calidad Alta.


## Novedades V6
- Modo Carrera.
- Modo Mundo Libre.
- Modo Persecución.
- Tráfico simple en pista.
- Coches de policía que persiguen al jugador.
- Sistema de daños.
- Objetivos por modo.
- Recompensas al terminar.
- HUD ampliado con daño, modo y objetivo.


## Novedades V7
- Tienda / mejoras.
- Monedas totales guardadas en localStorage.
- Recompensas por carrera y persecución.
- Mejoras por coche:
  - Velocidad
  - Aceleración
  - Control
  - Nitro
  - Resistencia
- Las mejoras afectan a la conducción real.
- Nitro máximo aumenta con mejoras.
- Daño recibido baja con resistencia.


## Novedades V8
- Perfil de jugador.
- Nivel y XP.
- Barra de progreso de XP.
- Misiones con recompensas.
- Estadísticas guardadas.
- Desbloqueo de coches por nivel o monedas.
- Desbloqueo de circuitos por nivel o monedas.
- Progreso completo en localStorage.


## Novedades V9
- Menú Personalizar.
- Pinturas por coche.
- Neones por coche.
- Alerones visuales por coche.
- Guardado de estilo en localStorage.
- Personalización aplicada al modelo 3D al jugar.


## Novedades V10
- Mini ciudad abierta en modo libre/persecución.
- Calles en cuadrícula.
- Cruces urbanos.
- Edificios con luces de neón.
- Zona Drift.
- Zona Sprint.
- Zona Bonus.
- Zona Garaje para reparar y recargar nitro.
- HUD con zona actual.
- Recompensas por entrar en zonas de actividad.


## Novedades V11
- Misiones urbanas activables en la ciudad.
- Entrega rápida.
- Carrera callejera.
- Desafío drift.
- Escape urbano.
- Marcadores de misión en el mapa.
- HUD con misión y progreso.
- Recompensas de monedas y XP.
- Estadística de misiones urbanas completadas.


## Novedades V12
- Menú Guardado.
- Exportar progreso a archivo JSON.
- Importar progreso desde archivo JSON.
- Resetear partida con confirmación.
- Guarda monedas, nivel, XP, mejoras, desbloqueos, personalización, ajustes y selección de coche/mapa.
- Ideal para pasar progreso entre versiones del juego.


## Novedades V13
- Sensibilidad de giro configurable.
- Tamaño de botones móvil configurable.
- Vibración ON/OFF en móvil compatible.
- Cámara Cerca / Normal / Lejos.
- La cámara cambia el FOV y distancia.
- Los ajustes se guardan en localStorage.
- El guardado exportado también incluye estos ajustes.


## Novedades V14
- Pantalla de carga mejorada con consejos.
- Tutorial inicial paso a paso.
- Menú de Logros.
- Logros con recompensas de monedas y XP.
- Logros por primera partida, primera carrera, monedas, misión urbana, persecución, personalización y mejoras.
- Los logros se guardan y se exportan con el guardado.


## Novedades V15
- PWA instalable.
- Archivo manifest.webmanifest.
- Service Worker.
- Caché offline básica de archivos locales.
- Iconos 192x192 y 512x512.
- Botón Instalar App cuando el navegador lo permita.
- Indicador de modo offline.
- Metadatos theme-color y apple-touch-icon.

## Importante
Para que la PWA funcione bien, abre el juego desde un servidor local o hosting HTTPS.
En local puedes usar:
python -m http.server 8000
y abrir:
http://localhost:8000


## Novedades V16
- Menú Dev / Diagnóstico.
- Contador FPS activable.
- Diagnóstico WebGL, PWA, Service Worker y estado online.
- Conteo de objetos de la escena.
- Panel de errores JavaScript.
- Botón para forzar calidad baja.
- Botón para copiar diagnóstico.
- Caché PWA actualizada a V16.


## Novedades V17
- Menú principal con tarjetas visuales de modo.
- Descripción rápida de Carrera, Mundo Libre y Persecución.
- Pantalla de resultado mejorada.
- Estadísticas post-partida:
  - tiempo final
  - mejor tiempo
  - posición
  - recompensa
  - monedas recogidas
  - daños
- Caché PWA actualizada a V17.


## Novedades V18
- Selector de idioma en Ajustes.
- Español, Inglés y Catalán.
- Idioma guardado en localStorage.
- El guardado exportado también incluye el idioma.
- Textos principales del menú traducibles.
- Caché PWA actualizada a V18.


## Novedades V19
- Menú Modo Foto.
- Cámara libre con teclado:
  - Flechas: rotar cámara
  - W/S: acercar y alejar
  - Q/E: subir y bajar
- Filtros:
  - Normal
  - Cine
  - Noir
  - Neón
  - Cálido
- Ocultar/mostrar HUD.
- Guardar captura PNG.
- preserveDrawingBuffer activado para capturas.
- El filtro de foto se guarda y se exporta con el guardado.
- Caché PWA actualizada a V19.


## Novedades V20
- Menú Clima.
- Climas:
  - Despejado
  - Lluvia
  - Niebla
  - Tormenta
- Hora:
  - Día
  - Atardecer
  - Noche
- Lluvia con partículas.
- Niebla ajustada por clima.
- Relámpagos en tormenta.
- Ciclo automático de clima y hora.
- HUD con clima actual.
- Clima guardado en localStorage.
- El guardado exportado también incluye clima y hora.
- Caché PWA actualizada a V20.


## Novedades V21
- Audio ambiental dinámico con Web Audio API.
- Sonido de lluvia generado proceduralmente.
- Truenos en tormenta.
- Ambiente urbano de fondo.
- Volumen de ambiente configurable.
- Audio conectado al clima actual.
- Audio conectado a modo libre/persecución.
- Guardado/exportación incluye volumen ambiental.
- Caché PWA actualizada a V21.


## Novedades V22
- Nuevo modo Duelo Local.
- Jugador 1 vs Jugador 2 en el mismo teclado.
- J1:
  - W/S acelerar/frenar
  - A/D girar
  - Espacio nitro
- J2:
  - Flechas acelerar/frenar/girar
  - Shift derecho nitro
- Segundo coche naranja.
- HUD básico de progreso del jugador 2.
- Resultado con ganador del duelo.
- Recompensas para el ganador.
- Caché PWA actualizada a V22.


## Novedades V23
- Nuevo menú Ranking.
- Mejores carreras locales.
- Historial de duelos locales.
- Historial reciente de partidas.
- Exportar ranking a JSON.
- Borrar ranking con confirmación.
- Las carreras guardan tiempo, posición, coche, mapa y recompensa.
- Los duelos guardan ganador, coche, mapa y recompensa.
- El guardado/exportación incluye el ranking local.
- Caché PWA actualizada a V23.


## Novedades V24
- Nuevo menú Taller.
- Diagnóstico del estado del coche.
- Indicador visual de salud del coche.
- Reparación usando monedas.
- Revisión completa con recarga de nitro.
- Consejos técnicos según daño.
- Daño guardado en localStorage.
- Guardado/exportación incluye daño y última reparación.
- Caché PWA actualizada a V24.


## Novedades V25
- Misiones de taller.
- Misión Entrega de piezas.
- Misión Reparación contrarreloj.
- Marcadores 3D para misiones de taller.
- HUD con misión de taller activa.
- Recompensas de monedas y XP.
- Bonos de reparación como recompensa especial.
- Usar bono para reparar con descuento.
- Bonos guardados en localStorage.
- Guardado/exportación incluye bonos de taller.
- Caché PWA actualizada a V25.


## Novedades V26
- Nuevo menú Modo Carrera.
- Sistema de contratos.
- Reputación de piloto.
- Temporadas.
- Contratos disponibles:
  - Piloto de circuito
  - Especialista urbano
  - Mensajero del taller
  - Cazador de monedas
  - Fuga controlada
- Recompensas de monedas, XP y reputación.
- HUD con contrato activo.
- Nueva temporada con recompensas escaladas.
- Guardado/exportación incluye modo carrera.
- Caché PWA actualizada a V26.


## Novedades V27
- Garaje avanzado.
- Estadísticas comparativas de coches:
  - velocidad
  - aceleración
  - manejo
  - nitro
- Marcar coches como favoritos.
- Recomendación automática para carrera.
- Recomendación automática para persecución.
- Consejo técnico por coche.
- Favoritos guardados en localStorage.
- Guardado/exportación incluye favoritos.
- Caché PWA actualizada a V27.


## Novedades V28
- Nuevo menú Eventos.
- Evento diario generado por fecha.
- Recompensas de monedas y XP.
- Bonus diario de inicio de sesión.
- Racha diaria con bonus creciente.
- Retos especiales:
  - Piloto constante
  - Caja fuerte
  - Dueño de la ciudad
- Progreso de eventos en HUD.
- Exportación/guardado incluye eventos diarios.
- Caché PWA actualizada a V28.


## Novedades V29
- Nuevo menú Mapa / GPS.
- Mapa grande en canvas.
- Iconos de zonas:
  - jugador
  - objetivo
  - garaje
  - taller
  - drift
  - bonus
  - policía
- GPS rápido a puntos importantes.
- Flecha de navegación en pantalla.
- HUD con destino y distancia.
- Dibujo de calles principales.
- Caché PWA actualizada a V29.


## Novedades V30
- Nuevo menú Radio.
- Radio del coche con música procedural.
- No necesita archivos de audio externos.
- Emisoras:
  - Electro Drive
  - Synth Night
  - Arcade FM
  - Chill Road
- Siguiente canción.
- Volumen de radio configurable.
- HUD con emisora activa.
- Visualizador animado.
- Guardado/exportación incluye ajustes de radio.
- Caché PWA actualizada a V30.


## Novedades V31
- Nuevo sistema de efectos visuales.
- Humo del coche.
- Humo más oscuro si hay mucho daño.
- Chispas al recibir daño/choques.
- Marcas de derrape.
- Estela visual de nitro.
- Limpieza automática de partículas para no saturar memoria.
- Caché PWA actualizada a V31.


## Novedades V32
- Nuevo sistema de ciudad viva.
- Semáforos 3D con ciclos rojo/amarillo/verde.
- Luces reales en semáforos.
- Señales urbanas con texto.
- Farolas repartidas por la ciudad.
- Conos de tráfico decorativos.
- Parpadeo suave en luces urbanas.
- Caché PWA actualizada a V32.


## Novedades V33
- Tráfico civil inteligente.
- Coches civiles circulando por la ciudad.
- Rutas por calles horizontales y verticales.
- Frenado cerca del jugador.
- Frenado básico en semáforos.
- Luces delanteras y luces de freno.
- Colisión suave con daño al jugador si golpea tráfico.
- Respawn automático para mantener la ciudad viva.
- Caché PWA actualizada a V33.


## Novedades V34
- Optimización automática por FPS.
- Modo rendimiento manual.
- Si detecta FPS bajos:
  - activa modo rendimiento
  - baja calidad gráfica
  - reduce efectos pesados
  - reduce tráfico visible
  - baja carga de animaciones urbanas
- Ajuste automático de pixel ratio.
- Estado de rendimiento en Ajustes.
- Guardado/exportación incluye ajustes de rendimiento.
- Caché PWA actualizada a V34.


## Novedades V35
- Nuevo menú Accesibilidad / Controles.
- Alto contraste.
- HUD grande.
- Reducir animaciones.
- Remapeo básico de teclas para jugador 1.
- Restaurar controles por defecto.
- Preferencias guardadas automáticamente.
- Guardado/exportación incluye accesibilidad y teclas.
- Caché PWA actualizada a V35.


## Novedades V36
- Ranuras de guardado manual.
- 3 slots de guardado.
- Autosave automático.
- Cargar autosave.
- Borrar slots con confirmación.
- Vista rápida de nivel, monedas y fecha por slot.
- Importación interna de objetos de guardado.
- Guardado/exportación incluye estado de autosave.
- Caché PWA actualizada a V36.


## Novedades V37
- Nuevo menú Tutorial Guiado.
- Objetivos paso a paso:
  - acelerar
  - girar
  - usar nitro
  - recoger monedas
  - completar carrera
  - probar taller
- Ayuda visual superpuesta durante la partida.
- Progreso del tutorial en HUD.
- Recompensa final:
  - 500 monedas
  - 250 XP
  - 1 bono de taller
- Guardado/exportación incluye tutorial guiado.
- Caché PWA actualizada a V37.


## Novedades V38
- Nuevo menú Modo Drift.
- Partida de drift de 90 segundos.
- Puntuación por derrape.
- Combo multiplicador.
- Barra de combo.
- Récord de puntuación.
- Mejor combo guardado.
- Recompensas de monedas y XP al terminar.
- HUD de drift durante la partida.
- Guardado/exportación incluye datos de drift.
- Caché PWA actualizada a V38.


## Novedades V39
- Sistema de policía avanzada.
- Nivel de búsqueda de 1 a 5 estrellas.
- Refuerzos policiales generados durante persecución.
- Coches de policía con luces rojas y azules.
- Temporizador de escape.
- Recompensas al escapar:
  - monedas
  - XP
- Daño si chocas con refuerzos policiales.
- HUD y overlay de búsqueda.
- Estadísticas de persecución guardadas.
- Caché PWA actualizada a V39.


## Novedades V40
- Nuevo modo Campeonato.
- Copa Neon de 5 rondas.
- Sistema de puntos por posición.
- Clasificación con rivales.
- Registrar ronda manualmente.
- Premio final según posición.
- Récord de copas ganadas.
- Mejor puntuación guardada.
- HUD de campeonato.
- Guardado/exportación incluye campeonato.
- Caché PWA actualizada a V40.


## Novedades V41
- Nuevo menú Showroom 3D.
- Canvas propio para ver el coche seleccionado.
- Modelo 3D de presentación generado en tiempo real.
- Rotación automática activable/desactivable.
- Cambiar coche desde el showroom.
- Seleccionar coche desde el showroom.
- Prueba rápida desde el showroom.
- Ficha técnica visual:
  - velocidad
  - aceleración
  - manejo
  - nitro
- Consejo técnico del coche.
- Guardado/exportación incluye rotación de showroom.
- Caché PWA actualizada a V41.


## Novedades V42
- Nuevo menú Momentos Destacados.
- Guarda momentos manualmente.
- Auto-destacados por:
  - velocidad muy alta
  - drift épico
  - persecución intensa
- Resumen de sesión:
  - velocidad máxima
  - mejor drift
  - mayor nivel de búsqueda
- Lista de últimos 20 destacados.
- Texto preparado para vídeo/directo.
- Copiar resumen al portapapeles.
- HUD con último clip destacado.
- Guardado/exportación incluye destacados.
- Caché PWA actualizada a V42.


## Novedades V43
- Nuevo menú Editor de Vinilos.
- Vista previa 2D del coche.
- Color principal.
- Color secundario.
- Acabados:
  - brillante
  - mate
  - metalizado
  - carbono
- Patrones de vinilo:
  - limpio
  - raya central
  - doble raya
  - rayo
  - racing lateral
  - cyber neon
- Intensidad de vinilo.
- Neón visual.
- Matrícula personalizada.
- Restaurar diseño por defecto.
- Guardado/exportación incluye vinilos.
- Caché PWA actualizada a V43.


## Novedades V44
- Nuevo menú Equipo.
- Nombre de crew personalizable.
- Nivel de crew.
- Reputación de crew.
- Miembros desbloqueables:
  - Mecánica
  - Copiloto
  - Tuner
  - Ojeador
  - Estratega
- Ventajas desbloqueables por nivel.
- Misiones de crew con recompensas.
- Bonus pasivo cada 6 horas.
- HUD de crew.
- Guardado/exportación incluye equipo.
- Caché PWA actualizada a V44.


## Novedades V45
- Nuevo menú Semanales.
- Eventos semanales según calendario.
- 4 retos semanales generados por semana.
- Pase de recompensas con 5 niveles.
- Puntos de pase.
- Recompensas:
  - monedas
  - XP
  - bonos de taller en niveles especiales
- HUD de pase semanal.
- Guardado/exportación incluye eventos semanales.
- Corrección de compatibilidad del sistema crew con XP.
- Caché PWA actualizada a V45.


## Novedades V46
- Nuevo menú Historia.
- Modo historia con 5 capítulos:
  - Llegada a Neon City
  - Garaje clandestino
  - Curvas bajo neón
  - Luces rojas y azules
  - Copa Neon
- Objetivos narrativos conectados a estadísticas reales.
- Recompensas por capítulo:
  - monedas
  - XP
  - bonos de taller en capítulos especiales
- Lista de capítulos.
- Lista de objetivos activos.
- HUD de historia.
- Guardado/exportación incluye progreso de historia.
- Caché PWA actualizada a V46.


## Novedades V47
- Nuevo menú Trofeos.
- Galería de medallas.
- Trofeos por:
  - carreras
  - drift
  - policía
  - campeonatos
  - crew
  - historia
  - semanales
  - monedas
  - tutorial
- Recompensas por trofeo:
  - monedas
  - XP
  - puntos de colección
- Recompensas de colección por conseguir 5, 10 y todos los trofeos.
- HUD de trofeos pendientes.
- Guardado/exportación incluye trofeos.
- Caché PWA actualizada a V47.


## Novedades V48
- Nuevo menú Álbum.
- Galería de coches.
- Coches vistos/no vistos.
- Coches bloqueados/desbloqueados.
- Rarezas:
  - común
  - raro
  - épico
  - legendario
- Puntos de colección por ver coches.
- Filtros:
  - todos
  - desbloqueados
  - bloqueados
- Seleccionar coche desde el álbum.
- Abrir coche en showroom desde el álbum.
- Recompensas por colección.
- HUD de progreso del álbum.
- Guardado/exportación incluye álbum de coches.
- Caché PWA actualizada a V48.


## Novedades V49
- Nuevo menú Gráficos.
- Perfiles visuales:
  - Móvil rápido
  - Equilibrado
  - Calidad alta
  - Ultra PC
  - Personalizado
- FPS objetivo:
  - 30
  - 45
  - 60
- Escala de resolución.
- Distancia de render.
- Densidad de tráfico.
- Activar/desactivar:
  - partículas
  - clima visual
  - sombras extra
  - reflejos
- Protección automática si bajan mucho los FPS.
- Diagnóstico gráfico rápido.
- HUD de GPU/FPS.
- Guardado/exportación incluye gráficos.
- Caché PWA actualizada a V49.


## Novedades V50
- Nuevo menú Motor Pro.
- Audio procedural con Web Audio API.
- Perfiles de motor:
  - Street
  - Sport
  - Supercar
  - Eléctrico futurista
  - Apagado
- Sonido de motor según velocidad/RPM.
- Sonido de turbo al usar nitro.
- Sonido de derrape al frenar y girar.
- Sirena procedural si sube el nivel de búsqueda.
- Mezcla independiente:
  - motor
  - turbo
  - derrape
  - sirenas
- Autoactivar al conducir.
- Vibración ligera en turbo.
- Telemetría de audio.
- HUD de motor.
- Guardado/exportación incluye audio avanzado.
- Caché PWA actualizada a V50.


## Novedades V51
- Nuevo menú Telemetría.
- Historial en tiempo real de:
  - velocidad
  - daño
  - nivel de búsqueda
  - drift
  - nitro
- Gráfica rápida en canvas.
- Resumen de sesión:
  - velocidad máxima
  - velocidad media
  - daño máximo
  - tiempo conduciendo
- Guardar sesiones de telemetría.
- Historial de hasta 20 sesiones.
- Borrar historial.
- HUD de telemetría.
- Guardado/exportación incluye telemetría.
- Caché PWA actualizada a V51.


## Novedades V52
- Nuevo menú Daños Pro.
- Estado mecánico más claro.
- Barra de daño.
- Kits de reparación.
- Comprar kits con monedas.
- Mejorar resistencia del coche.
- Avisos de daño:
  - leve
  - medio
  - grave
  - crítico
- Registro de impactos y reparaciones.
- HUD de daños y kits.
- Guardado/exportación incluye daños avanzados.
- Caché PWA actualizada a V52.


## Novedades V53
- Nuevo menú Clima Extremo.
- Eventos temporales:
  - tormenta
  - niebla densa
  - viento fuerte
- Intensidad progresiva.
- Temporizador de supervivencia.
- Recompensas por sobrevivir:
  - monedas
  - XP
- Efectos en la conducción:
  - tormenta puede aumentar daño
  - niebla reduce visibilidad interna
  - viento empuja ligeramente el coche
- Consejos de conducción por evento.
- Registro de eventos climáticos.
- HUD de clima extremo.
- Guardado/exportación incluye clima extremo.
- Caché PWA actualizada a V53.


## Novedades V54
- Nuevo menú Editor HUD.
- Presets:
  - Normal
  - Móvil grande
  - Directo / Stream
  - Minimalista
  - Cinemático
- Cambiar posición horizontal:
  - izquierda
  - centro
  - derecha
- Cambiar posición vertical:
  - arriba
  - medio
  - abajo
- Cambiar tamaño del HUD.
- Cambiar transparencia.
- Modo compacto.
- Brillo HUD activable.
- Zona segura móvil.
- Guardado/exportación incluye editor HUD.
- Caché PWA actualizada a V54.


## Novedades V55
- Nuevo menú Rutas.
- Editor de checkpoints personalizados.
- Añadir checkpoint desde la posición actual del coche.
- Deshacer último checkpoint.
- Limpiar ruta.
- Guardar hasta 12 rutas.
- Cargar y borrar rutas guardadas.
- Correr rutas personalizadas.
- Checkpoints visibles en el mundo 3D.
- Progreso y temporizador de ruta.
- Recompensas por completar rutas:
  - monedas
  - XP
- HUD de ruta personalizada.
- Guardado/exportación incluye rutas personalizadas.
- Caché PWA actualizada a V55.


## Novedades V56
- Nuevo menú Repetición.
- Grabación automática del recorrido reciente.
- Guarda hasta los últimos 360 puntos.
- Resumen de repetición:
  - velocidad máxima
  - distancia recorrida
  - daño máximo
  - mejor drift
- Fantasma 3D reproducible en el mundo.
- Pausar/activar grabación.
- Borrar repetición actual.
- Guardar hasta 8 repeticiones.
- Cargar y borrar repeticiones guardadas.
- Exportar repetición como JSON.
- HUD de replay.
- Guardado/exportación incluye modo repetición.
- Caché PWA actualizada a V56.


## Novedades V57
- Nuevo menú Habilidad.
- Retos cortos de conducción:
  - velocidad
  - precisión
  - control
- Puntuación dinámica por conducción.
- Rangos:
  - S
  - A
  - B
  - C
  - D
- Récord por tipo de reto.
- Historial de resultados.
- Recompensas por completar:
  - monedas
  - XP
- Racha de retos completados.
- HUD de reto activo.
- Guardado/exportación incluye retos de habilidad.
- Caché PWA actualizada a V57.


## Novedades V58
- Nuevo menú Códigos.
- Generar código de garaje.
- Copiar código para compartir.
- Importar código de garaje.
- Exporta/importa:
  - coche seleccionado
  - mapa seleccionado
  - personalización
  - vinilos
  - HUD
  - gráficos
  - audio de motor
  - controles
- Historial de últimos códigos generados.
- Sistema local, sin servidor.
- HUD de códigos generados.
- Guardado/exportación incluye códigos de garaje.
- Caché PWA actualizada a V58.


## Novedades V59
- Nuevo menú Pósters.
- Creador de miniaturas PNG.
- Plantillas:
  - neón gamer
  - tormenta épica
  - campeón
  - minimalista
  - persecución
- Texto principal y subtítulo editables.
- Formato 16:9 o cuadrado.
- Dibujo de coche estilo póster.
- Estadísticas integradas:
  - velocidad
  - daño
  - rango de habilidad
- Exportar póster como PNG.
- Historial de pósters generados.
- HUD de pósters.
- Guardado/exportación incluye creador de pósters.
- Caché PWA actualizada a V59.


## Novedades V60
- Nuevo menú Tráiler.
- Modo tráiler con escenas automáticas:
  - intro ciudad
  - aceleración
  - derrape
  - garaje
  - persecución
  - plano final
- Estilos de tráiler:
  - cinemático
  - acción
  - garaje
  - persecución
  - tormenta
- Opciones:
  - cámara automática
  - ocultar HUD
  - sensación slow motion
  - forzar clima visual
- Guion generado para vídeo.
- Título y descripción sugerida para YouTube.
- Copiar guion al portapapeles.
- Historial de tráileres completados.
- HUD de tráiler.
- Guardado/exportación incluye modo tráiler.
- Caché PWA actualizada a V60.


## Novedades V61
- Nuevo menú Showroom Pro.
- Ficha técnica avanzada por coche.
- Estadísticas visuales:
  - velocidad
  - aceleración
  - manejo
  - nitro
  - frenada
  - resistencia
- Rareza y rol de cada coche.
- Valoración general.
- Recomendación automática.
- Notas de conducción.
- Favoritos de showroom.
- Selector anterior/siguiente.
- Usar coche desde Showroom Pro.
- Prueba rápida desde Showroom Pro.
- Acceso directo a códigos de garaje.
- HUD de showroom.
- Guardado/exportación incluye Showroom Pro.
- Caché PWA actualizada a V61.


## Novedades V62
- Nuevo menú Banco.
- Economía avanzada local.
- Control de monedas actuales.
- Historial financiero:
  - ingresos
  - gastos
  - movimientos detectados automáticamente
- Balance total.
- Bonus diario del banco.
- Racha de bonus.
- Acciones rápidas de prueba:
  - pack de prueba
  - presupuesto taller
  - bono carrera
- Consejos financieros según estado de monedas.
- HUD de banco.
- Guardado/exportación incluye economía avanzada.
- Caché PWA actualizada a V62.


## Novedades V63
- Nuevo menú Piezas Pro.
- Inventario de piezas avanzado.
- Rarezas:
  - común
  - rara
  - épica
  - legendaria
- Slots instalables:
  - motor
  - turbo
  - neumáticos
  - frenos
  - chasis
- Bonus por coche.
- Packs de piezas:
  - básico
  - raro
  - épico
- Instalar/quitar piezas.
- Vender duplicados por monedas.
- Recompensas de XP al abrir packs.
- HUD de piezas instaladas.
- Guardado/exportación incluye piezas avanzadas.
- Caché PWA actualizada a V63.


## Novedades V64
- Nuevo menú Patrocinadores.
- Marcas ficticias:
  - NeonFuel
  - DriftLab
  - StormGuard
  - UrbanX
  - WantedPro
- Contratos de patrocinador.
- Objetivos de marca basados en estadísticas reales.
- Recompensas por contrato:
  - monedas
  - XP
  - reputación
- Niveles por patrocinador.
- Firmar contrato con distintas marcas.
- Reroll de contrato.
- Abandonar contrato.
- Historial de contratos completados.
- HUD de patrocinador.
- Guardado/exportación incluye patrocinadores.
- Caché PWA actualizada a V64.


## Novedades V65
- Nuevo menú Temporada.
- Temporada Neon V65.
- Nivel de temporada.
- Puntos de temporada.
- Misiones de temporada basadas en progreso real:
  - carreras
  - drift
  - policía
  - rutas
  - patrocinadores
  - habilidad
  - clima extremo
- Pase de recompensas con 8 niveles.
- Premios:
  - monedas
  - XP
- Cobrar premios disponibles.
- Historial de temporada.
- Puntos automáticos por progreso.
- Botón de test para sumar puntos.
- HUD de temporada.
- Guardado/exportación incluye temporada.
- Caché PWA actualizada a V65.


## Novedades V66
- Nuevo menú Piloto Pro.
- Perfil de piloto editable:
  - nombre
  - lema
- Rango global automático.
- Valoración de piloto.
- Tarjeta visual en canvas.
- Estadísticas destacadas:
  - carreras
  - drift
  - rango de habilidad
  - temporada
  - reputación de patrocinador
  - trofeos
  - rutas guardadas
- Resumen listo para compartir.
- Copiar resumen al portapapeles.
- Exportar perfil JSON.
- HUD de perfil de piloto.
- Guardado/exportación incluye perfil de piloto.
- Caché PWA actualizada a V66.
