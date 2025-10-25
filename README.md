# 🎬 Video Speed Helper

Una extensión para navegador que añade **controles avanzados de velocidad** a casi cualquier reproductor de video HTML5, incluyendo **Crunchyroll**, Netflix, YouTube, y plataformas que usan HLS, Mega, Netu, YourUpload, Maru, Pdrain, etc.

**🆕 Nueva funcionalidad**: **Selección inteligente por clic** - simplemente haz clic en cualquier reproductor para seleccionarlo automáticamente.

---

## 🚀 Funcionalidades principales

### 🎮 Controles de teclado
- **Shift + ↑** → Aumentar velocidad (por pasos configurables)
- **Shift + ↓** → Disminuir velocidad
- **Shift + R** → Restablecer velocidad a `1.0x`
- **Espacio (tap)** → Alterna Play/Pause normalmente
- **Espacio (mantener ≥ 1.0s)** → Reproduce al *Hold Speed* configurado (1.25x, 1.5x, 1.75x o 2x)
- Al soltar **Espacio** tras mantenerlo → Vuelve a `1.0x` y muestra el indicador correspondiente

### 🖱️ Selección inteligente **[NUEVO]**
- **Clic en reproductor** → Selecciona automáticamente el video para aplicar controles
- **Búsqueda inteligente** → Detecta videos en Shadow DOM, iframes y contenedores complejos
- **Prioridad manual** → Los videos seleccionados por clic tienen máxima prioridad
- **Confirmación visual** → Muestra el OSD al seleccionar un reproductor

### 🔧 Características técnicas
- **Detección mejorada** → Búsqueda periódica de videos cargados dinámicamente
- **Compatibilidad total** → Funciona en Crunchyroll, Netflix, sitios complejos de streaming
- **iframes y fullscreen** → Soporte completo para reproductores embebidos
- **Indicador visual (OSD)** → Aparece cada vez que la velocidad cambia

---

## 🖼️ Indicador en pantalla (OSD)

- Aparece en la esquina superior derecha del video o la pantalla.
- Fondo negro semi-transparente y texto blanco.
- Se mantiene visible mientras presionas **Espacio** en modo boost.
- Compatible con **fullscreen**, siempre permanece visible.

---

## 🧩 Popup de la extensión

Incluye una interfaz minimalista con:

- 📌 **Lista de atajos rápidos**
- ⚡ **Selector de Hold Speed** (1.25x, 1.5x, 1.75x, 2x)
- El valor seleccionado se aplica **incluso si el popup está cerrado**

Ejemplo visual:

```

Quick Controls
──────────────
Shift + ↑   Increase speed
Shift + ↓   Decrease speed
Shift + R   Reset speed
Space       Hold to play at 2.0x
Hold speed  \[ 2.0x ▼ ]

💡 Tip: Click on any video player to select it!

```

---

## 🎯 Uso en sitios problemáticos (ej: Crunchyroll)

### Método recomendado:
1. **Carga la página del video** (ej: episodio en Crunchyroll)
2. **Haz clic una vez en el reproductor** (área del video)
3. **¡Listo!** Todos los shortcuts funcionarán inmediatamente

### ¿Por qué es necesario?
Sitios como Crunchyroll cargan videos dinámicamente después de que se carga la página. El clic activa la detección inteligente que encuentra y selecciona el reproductor correcto automáticamente.

---

## ⚙️ Configuración

Desde la página de **Opciones** puedes personalizar:

- **Hold speed** (por defecto: `2.0x`)
- **Step** para incrementar/disminuir (por defecto: `0.25x`)
- **Velocidad mínima y máxima permitida**

Todos los cambios se guardan automáticamente en `chrome.storage.sync`.

---

## 📦 Instalación (modo desarrollador)

1. Clona este repositorio o descarga el ZIP.
2. Abre `chrome://extensions/` en tu navegador (Chrome/Edge/Brave).
3. Activa el **Modo desarrollador** (Developer mode).
4. Haz clic en **Cargar descomprimida (Load unpacked)**.
5. Selecciona la carpeta del proyecto.

---

## 🛠️ Tecnologías usadas

- **Manifest V3** (última versión de extensiones Chrome)
- **JavaScript vanilla** (sin frameworks externos)
- **CSS minimalista** para el OSD y popup
- **`chrome.storage.sync`** para persistencia de configuración
- **MutationObserver + Shadow DOM** para detectar videos dinámicamente
- **Detección por eventos de clic** para selección inteligente de reproductores
- **Búsqueda recursiva** en Shadow DOM e iframes para máxima compatibilidad

---

## 🐛 Solución de problemas

### Los controles no funcionan en la primera carga:
- **Solución**: Haz clic una vez en el reproductor de video
- **Causa**: Sitios como Crunchyroll cargan videos dinámicamente

### Debug y diagnóstico:
1. Abre **DevTools** (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes con prefijo `[VSH]`
4. Si no ves videos detectados, haz clic en el reproductor

### Videos múltiples en la página:
- El último video seleccionado por clic tendrá prioridad
- Los controles afectarán siempre al video seleccionado manualmente

---

## 🆕 Changelog v1.1.0

### ✨ Nuevas funcionalidades:
- **Selección por clic**: Haz clic en cualquier reproductor para seleccionarlo automáticamente
- **Detección mejorada**: Búsqueda periódica y recursiva de videos en Shadow DOM
- **Prioridad inteligente**: Videos seleccionados manualmente tienen máxima prioridad
- **Mejor compatibilidad**: Funciona correctamente con Crunchyroll desde la primera carga

### � Mejoras técnicas:
- Búsqueda en iframes (same-origin)
- Sistema de scoring mejorado para selección automática de videos
- Logging detallado para diagnóstico (`[VSH]` en consola)
- Gestión automática de estado de videos eliminados
- Timing de inyección optimizado (`document_end`)

### 🐛 Correcciones:
- Solucionado: Controles no funcionaban en primera carga de Crunchyroll
- Solucionado: Detección de videos cargados dinámicamente
- Mejorado: Manejo del botón Espacio para play/pause y hold

---

## �📋 Roadmap futuro

- [ ] Agregar soporte para **atajos configurables** desde opciones
- [ ] Mover el OSD de forma dinámica (esquina inferior, centro, etc.)
- [ ] Exportar/importar configuraciones de usuario
- [ ] Indicador visual del video seleccionado actualmente
- [ ] Publicar en **Chrome Web Store** y **Firefox Add-ons**

---

## 🤝 Contribuciones

¡Pull requests y sugerencias son bienvenidas!  
Si encuentras algún bug o deseas proponer mejoras, abre un **Issue** en este repositorio.

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia MIT.  
Eres libre de usarlo, modificarlo y compartirlo siempre que incluyas el aviso de licencia original.
