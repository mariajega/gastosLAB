# GastosLAB 1.6

Aplicación PWA de finanzas personales. Los datos financieros permanecen en el almacenamiento local de cada navegador/dispositivo. El servicio Cloudflare solo gestiona invitaciones y autorizaciones.

## Cloudflare: estado de la configuración

1. Crear un Worker llamado `gastoslab-access`.
2. Crear una base D1 (en este proyecto: `gastoslab-db`) y enlazarla al Worker con el binding **DB**.
3. Crear el secreto Worker **ADMIN_KEY**. Debe ser una contraseña aleatoria larga y privada; nunca se incluye en GitHub ni en el HTML.
4. En D1 Console, ejecutar el contenido de `cloudflare/schema.sql`. Si ya se crearon las tablas con la versión inicial de GastosLAB, ejecutar únicamente `ALTER TABLE invites ADD COLUMN revoked_at TEXT;` (no ejecutar el ALTER si la columna ya existe).
5. Copiar `cloudflare/worker.js` completo al editor del Worker y pulsar **Deploy**.
6. Abrir `https://gastoslab-access.<tu-subdominio>.workers.dev/api/health`. Debe responder `{"ok":true,"service":"GastosLAB access"}`.
7. En `auth-config.js`, sustituir `https://REEMPLAZAR.workers.dev` por la URL real del Worker.
8. Publicar todos los archivos de la carpeta GastosLAB en GitHub Pages.

## Administración

Abrir `admin.html` directamente desde la web publicada. Introducir la URL del Worker y el secreto `ADMIN_KEY`. Solo quien conozca ese secreto puede generar invitaciones, ver dispositivos y revocar accesos. Los usuarios normales no tienen un enlace al panel dentro de la aplicación.

Cada código `GL-XXXX-XXXX` se puede utilizar una sola vez y activa un único navegador/dispositivo. El servidor almacena hashes de códigos y tokens, no los códigos/token en claro (el código se muestra una sola vez al generarlo). La revocación de un dispositivo se aplica la próxima vez que la aplicación valide su token al abrirse/recargarse.

## Privacidad y límites

- Los movimientos, cuentas, presupuestos, objetivos y demás datos financieros no se envían a Cloudflare.
- Los tokens de acceso se guardan en localStorage del dispositivo autorizado.
- Revocar un dispositivo impide futuras validaciones; no borra datos que ya estuvieran guardados localmente en ese dispositivo.
- La protección de acceso no cifra los datos financieros locales ni impide que alguien con acceso al dispositivo y a sus herramientas de desarrollo inspeccione el almacenamiento del navegador.
- No hay conexión bancaria, Open Banking ni lectura de notificaciones.

## GitHub Pages y PWA

Subir todo el contenido de la carpeta, conservando `cloudflare/`, `admin.html`, `auth-config.js`, `index.html`, `sw.js`, `manifest.json` e `icons/`. No borrar los datos del navegador ni desinstalar la PWA durante una actualización.


## Atajo BBVA con bandeja de entrada iCloud (v1.7)

El atajo debe guardar cada pago como una línea JSON en un archivo `GastosLAB-inbox.jsonl` dentro de iCloud Drive. No debe abrir la URL de GastosLAB. En Atajos, crea el diccionario con estos campos: `id` (UUID), `type` (`expense`), `amount` (importe numérico), `date` (`AAAA-MM-DD`), `merchant` (comercio), `category` (categoría), `method` (`Tarjeta`) y `description` (opcional). Convierte el diccionario a JSON y añade un salto de línea al final. Usa la acción **Añadir a archivo de texto** sobre `GastosLAB-inbox.jsonl` en iCloud Drive.

Para incorporar los pagos, abre GastosLAB desde su icono, entra en Configuración > Bandeja de entrada del atajo y selecciona `GastosLAB-inbox.jsonl` desde Archivos. La importación añade únicamente movimientos nuevos; los identificadores UUID evitan duplicados si se vuelve a importar el mismo archivo. Después de importar, no borres el archivo si quieres conservar el histórico de la bandeja.

La PWA no puede leer silenciosamente archivos de iCloud Drive por las restricciones de iOS; por eso la selección del archivo en GastosLAB es manual. El archivo contiene datos financieros, así que mantenlo en tu iCloud privado.
