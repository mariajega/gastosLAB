# GastosLAB

Aplicación web instalable (PWA) para finanzas personales. Proyecto estático, sin backend ni conexión bancaria.

## Publicar en GitHub Pages
1. Descomprime la carpeta y sube **todo su contenido** al repositorio (no solo `index.html`).
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Guarda y espera a que GitHub Pages publique la dirección.
5. Abre la URL en Safari en el iPhone y usa **Compartir → Añadir a pantalla de inicio**.

## Atajo BBVA en iPhone
Configura la acción **Abrir URL** con esta dirección, sustituyendo el dominio por el de tu GitHub Pages:

`https://TU-USUARIO.github.io/TU-REPOSITORIO/?action=add-expense&source=bbva-card`

El atajo solo abre el formulario. No extrae ni lee el texto de la notificación BBVA. Importe, comercio y categoría se introducen manualmente.

## Datos y privacidad
- Los datos se guardan en `localStorage` del navegador y dispositivo actual.
- No existe conexión con BBVA, MyInvestor, Open Banking ni servicios de analítica.
- iPhone y ordenador mantienen almacenes independientes.
- Usa **Configuración → Exportar copia JSON** para guardar una copia y **Importar copia JSON** para restaurarla en otro dispositivo.
- La hucha elegida se incluye como icono de la aplicación y favicon.

## Consideraciones
- Los saldos de cuenta se calculan a partir del saldo inicial introducido y los movimientos registrados.
- Las transferencias entre cuentas propias no cuentan como ingresos ni gastos.
- Los recurrentes son previsiones; no se contabilizan como movimientos reales automáticamente.
- El capital invertido se introduce manualmente. No se consultan precios ni rentabilidades de mercado.
- El modo privacidad oculta importes visualmente; no cifra los datos locales ni sustituye el bloqueo del dispositivo.
