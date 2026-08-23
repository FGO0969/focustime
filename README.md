# FocusTime 🛡️

> Extensión para Zen Browser (y cualquier navegador basado en Firefox) que bloquea sitios web en intervalos de tiempo personalizados.

![Version](https://img.shields.io/badge/versión-1.0.0-blue)
![Firefox](https://img.shields.io/badge/Firefox-MV2-orange)
![License](https://img.shields.io/badge/licencia-MIT-green)

---

## ¿Qué hace?

FocusTime te permite definir reglas de bloqueo por dominio y horario. Por ejemplo:
- Bloquear YouTube de lunes a viernes de 9:00 a 18:00
- Bloquear Instagram todos los días de 22:00 a 8:00
- Bloquear cualquier sitio en los días y horas que elijas

Cuando intentas visitar un sitio bloqueado, ves una pantalla de aviso en lugar de la página.

---

## Capturas

| Lista de reglas | Añadir regla | Sitio bloqueado |
|---|---|---|
| Gestiona tus reglas activas con toggle on/off | Configura dominio, horario y días | Pantalla limpia al intentar acceder |

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

1. Descarga o clona este repositorio
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
3. Escribe el dominio (ej: `youtube.com`)
4. Configura el rango horario y los días de la semana
5. Guarda — el bloqueo es inmediato

Para desactivar una regla temporalmente, usa el toggle sin eliminarla.

---

## Estructura del proyecto

```
focustime/
├── manifest.json        # Configuración de la extensión
├── background.js        # Lógica de bloqueo (webRequest)
├── popup.html           # Interfaz principal
├── popup.css            # Estilos (diseño estilo Apple)
├── popup.js             # Lógica del popup
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

## Licencia

MIT © [Miguel Granados](https://github.com/FGO0969)
