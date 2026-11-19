# GastosLAB

Aplicación web instalable (PWA) para finanzas personales. Proyecto estático, sin backend ni conexión bancaria.

## Publicar en GitHub Pages
1. Descomprime la carpeta y sube **todo su contenido** al repositorio (no solo `index.html`).
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Guarda y espera a que GitHub Pages publique la dirección.
5. Abre la URL en Safari en el iPhone y usa **Compartir → Añadir a pantalla de inicio**.

## Atajo de registro en iPhone
Configura la acción **Abrir URL** con esta dirección, sustituyendo el dominio por el de tu GitHub Pages:

`https://TU-USUARIO.github.io/TU-REPOSITORIO/?action=add-expense&source=shortcut`

El atajo solo abre el formulario. No extrae ni lee el contenido de ninguna notificación. Importe, comercio y categoría se introducen manualmente.

## Datos y privacidad
- Los datos se guardan en `localStorage` del navegador y dispositivo actual.
- No existe conexión con entidades financieras, Open Banking ni servicios externos de analítica.
- iPhone y ordenador mantienen almacenes independientes.
- Usa **Configuración → Exportar copia JSON** para guardar una copia y **Importar copia JSON** para restaurarla en otro dispositivo.
- La hucha elegida se incluye como icono de la aplicación y favicon.

## Consideraciones
- Los saldos de cuenta se calculan a partir del saldo inicial introducido y los movimientos registrados.
- Las transferencias entre cuentas propias no cuentan como ingresos ni gastos.
- Los recurrentes son previsiones; no se contabilizan como movimientos reales automáticamente.
- El capital invertido se introduce manualmente. No se consultan precios ni rentabilidades de mercado.
- El modo privacidad oculta importes visualmente; no cifra los datos locales ni sustituye el bloqueo del dispositivo.


## Datos de ejemplo y configuración inicial

La primera apertura muestra movimientos ficticios para explorar los gráficos y las secciones. En Configuración, selecciona «Borrar datos de ejemplo y configurar mis cuentas» para eliminarlos e introducir los saldos iniciales de Principal, Ahorros e Inversiones.

## Copias automáticas locales

GastosLAB conserva hasta 14 copias diarias en el almacenamiento local del navegador. Si la app está abierta a medianoche, crea una copia entonces; si estaba cerrada, la crea al volver a abrirla ese día. Estas copias protegen frente a errores de la app, pero no frente al borrado completo del almacenamiento del navegador o la pérdida del dispositivo. Exporta periódicamente un JSON y guárdalo fuera del dispositivo.


## Versión 1.2
- Corregido el filtro de Movimientos (estado de tipo de movimiento inicializado).
- Navegación móvil ampliada a todas las secciones: Recurrentes, Presupuestos, Objetivos y Análisis incluidos.
- Navegación móvil reorganizada en dos filas para hacer visibles las opciones de planificación.
- Caché del service worker versionada para forzar la actualización de la interfaz.

## Versión 1.5 · Vista de demostración y acceso por invitación
- Sin autorización, la aplicación muestra únicamente el panel de inicio con datos ficticios y en modo de solo lectura.
- Para activar el uso completo, cada dispositivo necesita un código de invitación de un solo uso.
- Solo la persona que conoce el secreto `ADMIN_KEY` puede utilizar `admin.html` y las rutas `/api/admin/*` para crear invitaciones, consultar dispositivos y revocar accesos. Los usuarios invitados no reciben esa clave. La administración no aparece enlazada en la interfaz normal; el propietario accede directamente a `admin.html`.
- Los datos financieros no se envían al servicio de autorizaciones: permanecen en el almacenamiento local del navegador.
- El servicio de autorización requiere desplegar `cloudflare/worker.js`, crear una base D1 con `cloudflare/schema.sql`, enlazarla como `DB` y configurar el secreto `ADMIN_KEY`.
- Después del despliegue, sustituye `https://REEMPLAZAR.workers.dev` en `auth-config.js` por la URL real del Worker. No publiques ni compartas la clave `ADMIN_KEY`.
- El propietario abre directamente `admin.html`, introduce la URL del Worker y la clave secreta de administración y genera invitaciones. No compartas `ADMIN_KEY` con nadie. Quien solo recibe un código de invitación no puede generar otros códigos ni administrar dispositivos.

**Importante:** hasta configurar y desplegar el Worker, la vista de demostración funcionará, pero no será posible activar dispositivos. GitHub Pages por sí solo no puede validar invitaciones de forma segura.


## Separación de permisos de administración
- La API exige `Authorization: Bearer ADMIN_KEY` en todas las rutas `/api/admin/*`; sin el secreto devuelve 401.
- La clave de administración no se incluye en `index.html`, `auth-config.js` ni en el almacenamiento del navegador de los usuarios.
- La página `admin.html` puede ser técnicamente accesible por URL, pero sus operaciones administrativas están protegidas por el Worker. La interfaz de la aplicación no muestra enlaces a ella.
- Comparte únicamente códigos de invitación de un solo uso, nunca el secreto `ADMIN_KEY`.
