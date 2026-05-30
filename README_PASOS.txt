FIREKWORKS WEB — versión editable con Decap CMS

QUÉ HAY DENTRO
- index.html: la landing principal con animaciones.
- project.html: página individual de proyecto.
- data/site.json: textos, WhatsApp, SEO, servicios y proyectos.
- admin/: panel Decap CMS para editar desde /admin.
- assets/uploads/: imágenes y PNGs.

CÓMO PREVISUALIZAR EN TU MAC
1. Abre la carpeta en Visual Studio Code.
2. Instala la extensión “Live Server”.
3. Botón derecho en index.html > Open with Live Server.

CÓMO EDITAR SIN TOCAR CÓDIGO
Cuando esté subido a Netlify y activado Decap CMS:
1. Entra en https://TU-DOMINIO.es/admin
2. Edita “Contenido principal”.
3. Guarda y publica.
4. Netlify actualizará la web.

QUÉ CAMBIAR EN SITE.JSON SI EDITAS A MANO
- whatsappPhone: tu número en formato 34600000000.
- hero: textos del primer pantallazo.
- problem/system/services/difference: textos de secciones.
- projects.items: proyectos e imágenes.

IMPORTANTE
Para usar Decap CMS necesitas subir esta carpeta a un repositorio GitHub y conectar ese repositorio con Netlify.
