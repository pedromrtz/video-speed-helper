# 🎬 Video Speed Helper

Una extensión para navegador que añade **controles avanzados de velocidad** a casi cualquier reproductor de video HTML5, incluyendo Crunchyroll y plataformas que usan HLS, Mega, Netu, YourUpload, Maru, Pdrain, etc.

---

## 🚀 Funcionalidades principales

- **Shift + ↑** → Aumentar velocidad (por pasos configurables)
- **Shift + ↓** → Disminuir velocidad
- **Shift + R** → Restablecer velocidad a `1.0x`
- **Espacio (tap)** → Alterna Play/Pause normalmente
- **Espacio (mantener ≥ 1.5s)** → Reproduce al *Hold Speed* configurado (1.25x, 1.5x, 1.75x o 2x)
- Al soltar **Espacio** tras mantenerlo → Vuelve a `1.0x` y muestra el indicador correspondiente
- Funciona dentro de **iframes** y en **modo pantalla completa**
- Muestra un **indicador visual (OSD)** cada vez que la velocidad cambia

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

```

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

---

## 📋 Roadmap futuro

- [ ] Agregar soporte para **atajos configurables** desde opciones.
- [ ] Mover el OSD de forma dinámica (esquina inferior, centro, etc.).
- [ ] Exportar/importar configuraciones de usuario.
- [ ] Publicar en **Chrome Web Store** y **Firefox Add-ons**.

---

## 🤝 Contribuciones

¡Pull requests y sugerencias son bienvenidas!  
Si encuentras algún bug o deseas proponer mejoras, abre un **Issue** en este repositorio.

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia MIT.  
Eres libre de usarlo, modificarlo y compartirlo siempre que incluyas el aviso de licencia original.
