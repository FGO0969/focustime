# FocusTime 🛡️

> Extensión para Zen Browser (y cualquier navegador basado en Firefox) que bloquea sitios web en intervalos de tiempo personalizados.

![Version](https://img.shields.io/badge/versión-1.1.0-brightgreen)
![Firefox](https://img.shields.io/badge/Firefox-MV2-orange)
![License](https://img.shields.io/badge/licencia-MIT-green)

---

## ¿Qué hace?

FocusTime te permite definir reglas de bloqueo por dominio y horario. Por ejemplo:
- Bloquear YouTube de lunes a viernes de 9:00 a. m. a 6:00 p. m.
- Bloquear Instagram todos los días de 10:00 p. m. a 8:00 a. m.
- Bloquear cualquier sitio en los días y horas que elijas

Cuando intentas visitar un sitio bloqueado, ves una pantalla de aviso en lugar de la página.

---

## Características

- **Reglas sin interruptor de apagado** — una regla creada está siempre activa. La única forma de quitarla es eliminarla, para que no sea tan fácil saltarse el bloqueo.
- **Diseño Liquid Glass** — tarjetas translúcidas con desenfoque y fondo animado en tonos verdes, inspirado en el lenguaje visual de Apple.
- **Modo oscuro** — sigue el tema del sistema y se puede cambiar a mano con el botón 🌙 / ☀️. La preferencia se recuerda.
- **Iconos reales de cada sitio** — se cargan desde DuckDuckGo y, si fallan, desde Google; si ninguno responde se muestra un emoji.
- **Selector de hora integrado** — columnas de hora, minutos (de 5 en 5) y a. m. / p. m. dentro del popup, en lugar del reloj nativo de Firefox, que se abría detrás de la ventana.
- **Varios horarios por regla** — cada uno con sus propios días de la semana. Los horarios que cruzan la medianoche (ej. 10:00 p. m. → 6:00 a. m.) funcionan.
- **Indicador de estado** — cada regla muestra si está *Bloqueando* ahora mismo o solo *Activa*.

---

## Pantallas

| Lista de reglas | Añadir regla | Sitio bloqueado |
|---|---|---|
| Reglas con icono del sitio, horario y estado | Dominio, horarios con selector propio y días | Aviso con el mismo estilo Liquid Glass |

---

## Instalación en Zen Browser

### Método 1 — Temporal (para probar)

1. Abre `about:debugging` en Zen Browser
2. Haz clic en **"Este Firefox"**
3. Haz clic en **"Cargar complemento temporal..."**
4. Selecciona el archivo `manifest.json` de esta carpeta

> ⚠️ La extensión temporal desaparece al cerrar el navegador.

### Método 2 — Permanente (recomendado)

**Paso 1** — Desactiva la verificación de firma:

1. Ve a `about:config`
2. Busca `xpinstall.signatures.required`
3. Cambia el valor a `false`

**Paso 2** — Copia la extensión al perfil:

1. Descarga `focustime.xpi` desde la página de [Releases](https://github.com/FGO0969/focustime/releases/latest)
2. Abre PowerShell y ejecuta:

```powershell
# Encuentra tu perfil de Zen Browser
Get-ChildItem "$env:APPDATA\zen\Profiles" -Force
```

3. Copia el `.xpi` al perfil activo (el que tenga fecha más reciente):

```powershell
Copy-Item "focustime.xpi" "$env:APPDATA\zen\Profiles\<tu-perfil>\extensions\focustime@granadosmiguelandres.dev.xpi"
```

4. Reinicia Zen Browser — la extensión se instala automáticamente.

### Actualizar a una versión nueva

Zen bloquea el archivo mientras está abierto, así que primero **cierra Zen por completo** y luego reemplaza el `.xpi`:

```powershell
Remove-Item "$env:APPDATA\zen\Profiles\<tu-perfil>\extensions\focustime@granadosmiguelandres.dev.xpi" -Force -ErrorAction SilentlyContinue
Copy-Item "focustime.xpi" "$env:APPDATA\zen\Profiles\<tu-perfil>\extensions\focustime@granadosmiguelandres.dev.xpi" -Force
```

Al volver a abrir Zen se carga la versión nueva. Tus reglas se conservan.

---

## Cómo generar el `.xpi`

```powershell
$source = ".\focustime"
$dest   = ".\focustime.xpi"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
Get-ChildItem $source -Recurse -File | ForEach-Object {
    $entry = $_.FullName.Substring($source.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entry, 'Optimal') | Out-Null
}
$zip.Dispose()
```

---

## Uso

1. Haz clic en el icono 🛡️ en la barra del navegador
2. Pulsa **+** para crear una nueva regla
3. Escribe el dominio (ej: `youtube.com`); también se bloquean sus subdominios
4. Toca la hora de inicio o de fin para abrir el selector y elige hora, minutos y a. m. / p. m.
5. Marca los días de la semana (L M X J V S D)
6. Usa **+ Añadir horario** si quieres más de un intervalo
7. Guarda — el bloqueo es inmediato

Las reglas se pueden **editar** o **eliminar**, pero no apagar temporalmente.

---

## Estructura del proyecto

```
focustime/
├── manifest.json        # Configuración de la extensión
├── background.js        # Lógica de bloqueo (webRequest)
├── popup.html           # Interfaz principal
├── popup.css            # Estilos Liquid Glass + modo oscuro
├── popup.js             # Lógica del popup, selector de hora y tema
├── blocked.html         # Página mostrada al bloquear
├── blocked.css          # Estilos de la página de bloqueo
└── icons/
    ├── icon-48.svg
    └── icon-96.svg
```

---

## Compatibilidad

| Navegador | Compatible |
|---|---|
| Zen Browser | ✅ |
| Firefox | ✅ |
| Firefox ESR | ✅ |
| Firefox Developer Edition | ✅ |
| Chrome / Edge | ❌ (requiere MV3) |

---

## Historial de cambios

### 1.1.0
- Rediseño Liquid Glass con fondo animado en tonos verdes
- Modo oscuro automático y manual
- Iconos reales de cada sitio (DuckDuckGo → Google → emoji)
- Selector de hora propio dentro del popup, con a. m. / p. m. visible
- Se quitó el interruptor para apagar reglas: ahora solo se pueden editar o eliminar
- Página de bloqueo rediseñada y simplificada

### 1.0.0
- Primera versión: reglas por dominio con varios horarios y días, página de bloqueo

---

## Licencia

MIT © [Miguel Granados](https://github.com/FGO0969)
