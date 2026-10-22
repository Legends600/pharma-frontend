# Matriz de pruebas S11 — SPA segura (login, sesión, interceptores, guards, menú y 401/403)

- **Proyecto:** PharmaSoft (`pharma-frontend`, rama `feature/seguridad-spa-pruebas-tineo`) + Practica (`feature/seguridad-pruebas-tineo`, commit `abc3459`).
- **Fecha de ejecución:** 22 de octubre de 2026 · Oracle local · SPA en `http://localhost:4200` · API en `http://localhost:8080/api/v1`.
- **Código probado:** los casos L, S, I, G, M y E se ejecutaron sobre el Reto 01 (`b4a049a`); los B, sobre `e9b452b`; los MC, sobre `11150ee`. La re-prueba de L-03 se hizo con la corrección `f03ecc8`.
- **Medios:** Chromium automatizado con Playwright. Las capturas no muestran las herramientas del desarrollador (F12), así que cada una lleva abajo a la derecha un recuadro con la URL actual y lo que se leyó del navegador: método, código HTTP, encabezado `Authorization` y contenido de `sessionStorage`. **El token nunca aparece completo:** solo se ven los primeros 27 caracteres seguidos de «…(oculto)».
- **Evidencias:** `<ID>_<detalle>.png`, entregadas en el anexo de `Tineo_LP2_S11_Autonoma.pdf` (no se suben al repositorio).
- **Criterio:** el resultado esperado sale de la guía; si la SPA hace otra cosa, el caso **falla** y genera un hallazgo (ver `docs/informe-s11.pdf`).
- **Usuarios:** admin / Admin2026* (ADMIN) · vendedor / Vendedor2026* (VENDEDOR) · almacen / Almacen2026* (ALMACENERO) · supervisor / Supervisor2026* (VENDEDOR + ALMACENERO) · inactivo / Inactivo2026* (deshabilitado).

## Permisos esperados por usuario (PermisosPorRol del backend)

| Usuario | Menú | Catálogo (nuevo / editar / dar de baja) | «+ Nuevo cliente» | «+ Nueva venta» |
|---|---|---|---|---|
| admin | Inicio, Categorías, Productos, Clientes, Ventas, Reportes | sí | sí | sí |
| vendedor | Inicio, Categorías, Productos, Clientes, Ventas | no | sí | sí |
| almacen | Inicio, Categorías, Productos | sí | — (sin el módulo) | — (sin el módulo) |
| supervisor | Inicio, Categorías, Productos, Clientes, Ventas | sí | sí | sí |

## Parte A — Matriz (16 casos base + 4 propios)

| ID | Grupo | Usuario | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| L-01 | Login | — | 1) En `/login` pulsar «Ingresar» vacío. 2) Escribir solo `vendedor` y pulsar «Ingresar». | Mensajes de validación; ninguna petición en Red. | 1) «Ingrese su usuario.» e «Ingrese su contraseña.». 2) Solo «Ingrese su contraseña.». Peticiones a la API: **0** en ambos. | Pasa | L-01_vacio.png, L-01_solo-usuario.png |
| L-02 | Login | noexiste, admin, inactivo | Intentar `noexiste`/Cualquier2026*, `admin`/Clave-Mala1 e `inactivo`/Inactivo2026*. | El mismo mensaje en los tres casos; la contraseña se borra y el usuario se conserva. | Los tres: `POST /auth/login` → **401**, «Usuario o contraseña incorrectos»; el campo usuario conserva el valor y la contraseña queda vacía. | Pasa | L-02_inexistente.png, L-02_clave-incorrecta.png, L-02_inactivo.png |
| L-03 | Login | vendedor | Con datos correctos, doble clic en «Ingresar». | Una sola petición `POST /auth/login` (el botón se deshabilita). | Se enviaron **2** `POST /auth/login`: el segundo clic llega antes de que el botón se deshabilite. **Hallazgo H-01.** Re-prueba con `f03ecc8`: 1, 1 y 1 POST en tres repeticiones. | **Falla** (corregido) | L-03_red.png, L-03_reprueba.png |
| L-04 | Login | vendedor | Abrir `/login?returnUrl=https://sitio-falso.com` e iniciar sesión. | Va a `/inicio`, nunca a un sitio externo. | Tras el login la URL es `http://localhost:4200/inicio`. | Pasa | L-04_redireccion.png |
| L-05 *(propio)* | Login | vendedor | Abrir `/login?returnUrl=%2F%2Fsitio-falso.com%2Flogin` (URL relativa al protocolo `//…`) e iniciar sesión. | Va a `/inicio`: `//sitio` también es externo aunque empiece con `/`. | Tras el login la URL es `/inicio`. | Pasa | L-05_redireccion.png |
| S-01 | Sesión | vendedor | Iniciar sesión, ir a Productos, pulsar F5; luego cerrar y abrir el navegador (nueva sesión del navegador) y pedir `/productos`. | Tras F5 sigue la sesión; tras cerrar el navegador se pide login. | F5: sigue en `/productos` con «Lucia Ramos Cutipa · VENDEDOR». Navegador nuevo: `pharmasoft.sesion` = null → `/login?returnUrl=%2Fproductos`. | Pasa | S-01_f5.png, S-01_reabrir.png |
| S-02 | Sesión | vendedor | En Almacenamiento de sesión cambiar `expiraEn` a hace 1 minuto y pulsar F5. | La sesión guardada se descarta y aparece el login. | Login con `returnUrl=%2Fproductos`; la clave `pharmasoft.sesion` ya no existe (null). | Pasa | S-02_vencida.png |
| S-03 | Sesión | — | Escribir `esto no es JSON {` en `pharmasoft.sesion` y abrir `/productos`. | La SPA no se rompe: muestra el login (try/catch). | Login con `returnUrl=%2Fproductos`; **0** errores no controlados; la clave dañada se borró. | Pasa | S-03_danada.png |
| S-04 | Sesión | vendedor | (a) Con sesión, abrir otra pestaña escribiendo la URL. (b) Abrir una segunda pestaña desde la SPA (`window.open`), cerrar sesión en la primera y navegar a Ventas en la segunda. | Registrar qué ocurre y explicarlo. | (a) La pestaña nueva pide login (`sessionStorage` es por pestaña). (b) La pestaña abierta desde la SPA copió el `sessionStorage`: tras cerrar sesión en la primera, en la segunda `GET /api/v1/ventas` → **200** y la sesión sigue abierta. **Hallazgo H-02.** | **Falla** | S-04_pestana-nueva.png, S-04_pestana1-cerrada.png, S-04_pestana2-sigue.png |
| S-05 *(propio)* | Sesión | vendedor | Comparar `expiraEn` (SPA) con el `exp` firmado dentro del JWT y con la hora del encabezado. | La SPA vence al mismo tiempo que el token (diferencia ≤ 2 s). | Diferencia de **1 s**; el encabezado muestra la misma hora («expira 10:36»). | Pasa | S-05_expiracion.png |
| I-01 | Interceptor | vendedor | Revisar `GET /productos`, `POST /auth/login` y una petición a otro dominio (`GET https://httpbin.org/headers`, enviada con el mismo `HttpClient` de la SPA). | Solo las peticiones a la API llevan `Authorization: Bearer`. | `GET /api/v1/productos` → `Bearer eyJhbGciOiJIUzM4NCJ9…(oculto)`; `POST /auth/login` → sin encabezado; httpbin → sin encabezado (los encabezados que recibió no incluyen `Authorization`). | Pasa | I-01_red.png |
| I-02 | Interceptor | vendedor | Con sesión iniciada, detener el backend y navegar a Productos. | Mensaje de error de conexión; la sesión no se cierra (no es un 401). | `GET /categorias` y `GET /productos` → `net::ERR_CONNECTION_REFUSED` (status 0); «No se pudo conectar con el servidor…»; el encabezado y `pharmasoft.sesion` siguen. | Pasa | I-02_backend-detenido.png |
| I-03 | Interceptor | vendedor | Alterar un carácter de la firma del token, recargar y abrir Ventas. | 401; login con «Su sesión expiró» y `returnUrl=%2Fventas`. | Primera respuesta **401** → `/login?expirada=1&returnUrl=%2Fventas` con el aviso. | Pasa | I-03_401.png |
| G-01 | Guards | — | Sin sesión, escribir `/productos/1/editar`, `/ventas/nueva` e `/inicio`. | Login con el `returnUrl` de cada ruta. | `returnUrl=%2Fproductos%2F1%2Feditar`, `%2Fventas%2Fnueva` y `%2Finicio`. | Pasa | G-01_productos-editar.png, G-01_ventas-nueva.png, G-01_inicio.png |
| G-02 | Guards | vendedor, almacen | VENDEDOR escribe `/categorias/nuevo` y `/productos/1/editar`; ALMACENERO escribe `/ventas/nueva`. | «403 · Acceso denegado» en los tres casos. | Los tres terminan en `/acceso-denegado` («403 · Acceso denegado»). | Pasa | G-02_vendedor-categorias-nuevo.png, G-02_vendedor-productos-editar.png, G-02_almacen-ventas-nueva.png |
| G-03 *(propio)* | Guards | vendedor, almacen, admin | VENDEDOR escribe `/reportes/ventas-por-categoria`; ALMACENERO escribe `/clientes`; ADMIN abre el reporte. | Módulos agregados a la SPA (Reportes, Clientes) también protegidos por permiso. | VENDEDOR y ALMACENERO → «Acceso denegado»; ADMIN ve el reporte. | Pasa | G-03_vendedor-reportes.png, G-03_almacen-clientes.png, G-03_admin-reportes.png |
| M-01 | Menú y acciones | admin, vendedor, almacen, supervisor | Iniciar sesión con cada usuario activo y revisar menú, Categorías, Productos, Clientes y Ventas. | Cada usuario ve exactamente lo que indica su tabla de permisos. | Coincide con la tabla de arriba en los cuatro usuarios: vendedor sin «+ Nuevo producto» ni columna Acciones; almacen sin Clientes ni Ventas; supervisor con la unión de permisos; admin con Reportes. | Pasa | M-01_admin.png, M-01_vendedor.png, M-01_almacen.png, M-01_supervisor.png |
| M-02 | Menú y acciones | admin → almacen | Con ADMIN, guardar una marca en `window`; cerrar sesión e ingresar como ALMACENERO sin recargar. | El menú cambia sin F5 (`computed`). | La marca en memoria sigue igual (no hubo recarga); menú de 6 opciones → «Inicio, Categorías, Productos». | Pasa | M-02_admin.png, M-02_almacen.png |
| E-01 | 401 / 403 | vendedor | En Productos (sin botones «Dar de baja»), ejecutar desde la consola `darDeBaja()` del componente. | El backend responde 403; la SPA muestra el mensaje y la sesión continúa. | Botones visibles: 0. `DELETE /api/v1/productos/58` → **403**; la SPA muestra «No tiene permisos para realizar esta operación»; después `GET /api/v1/ventas` → 200. | Pasa | E-01_403.png, E-01_sesion-continua.png |
| E-02 *(propio)* | 401 / 403 | almacen | Desde la consola, enviar `POST /api/v1/ventas` con el `HttpClient` de la SPA. | 403 (no 401): la sesión no se cierra. | **403** «No tiene permisos para realizar esta operación»; sigue en `/productos` y `pharmasoft.sesion` presente. | Pasa | E-02_403.png |

## Parte B — Aviso previo a la expiración y «Mi cuenta»

Backend ejecutado con `--app.jwt.expiracion-minutos=3` (parámetro de arranque; el yaml sigue en 60 y se volvió a 60 al terminar).

| ID | Grupo | Usuario | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| B-01 | Aviso de expiración | vendedor | Iniciar sesión (token de 180 s) y esperar. | El aviso aparece cuando quedan 2 minutos o menos. | Con 179 s, sin aviso. Aparece con **121 s**: «Su sesión vence en 02:00.», dentro de un contenedor `role="status"`. | Pasa | B-01_antes.png, B-01_aparece.png |
| B-02 | Aviso de expiración | vendedor | Esperar 7 s con el aviso visible. | La cuenta regresiva avanza en formato mm:ss. | 02:00 → **01:53**. | Pasa | B-02_cuenta-regresiva.png |
| B-03 | Aviso de expiración | vendedor | Pulsar «×». | El aviso se oculta hasta la siguiente sesión. | El aviso desaparece con 112 s restantes y no vuelve hasta el vencimiento. | Pasa | B-03_oculto.png |
| B-04 | Aviso de expiración | vendedor | Esperar a que la cuenta llegue a cero. | La SPA vuelve al login. | Login con «Su sesión expiró» y `returnUrl=%2Fventas`, 0,3 s después del vencimiento; `pharmasoft.sesion` = null. | Pasa | B-04_cero-login.png |
| B-05 *(propio)* | Aviso de expiración | supervisor | Con el aviso visible, pulsar «Cerrar sesión ahora». | Cierra la sesión y detiene el `setInterval` (sin temporizadores huérfanos). | Login; `clearInterval(5)` llamado con el id de la cuenta regresiva; 3 s después `segundosRestantes` = 0 y `porVencer` = false. | Pasa | B-05_antes.png, B-05_cerrar-ahora.png |
| MC-01 | Mi cuenta | — | Sin sesión, escribir `/mi-cuenta`. | Ruta protegida por `authGuard`. | `/login?returnUrl=%2Fmi-cuenta`. | Pasa | MC-01_sin-sesion.png |
| MC-02 | Mi cuenta | almacen, supervisor | Abrir «Mi cuenta» desde el enlace del encabezado. | Nombre, usuario, roles como etiquetas y permisos por módulo con ✔/✘. | `GET /api/v1/auth/me` → 200. almacen: ALMACENERO, 2 ✔ / 6 ✘. supervisor: ALMACENERO + VENDEDOR, 6 ✔ / 2 ✘. Sin aviso de cambio. | Pasa | MC-02_almacen.png, MC-02_supervisor.png |
| MC-03 | Mi cuenta | supervisor | Demorar 4 s y luego cortar `GET /auth/me` (Playwright `page.route`); pulsar «Reintentar». | Estados de carga y de error. | «Cargando sus datos…»; luego «No se pudo conectar con el servidor…» con «Reintentar» (la sesión sigue); el reintento responde 200. | Pasa | MC-03_carga.png, MC-03_error.png |
| MC-04 | Mi cuenta | supervisor | Como ADMIN, `PUT /usuarios/4/roles` → solo VENDEDOR; el supervisor abre «Mi cuenta» con su sesión anterior. Luego restaurar los roles. | Aviso «Sus permisos cambiaron…». | Servidor: VENDEDOR; sesión: ALMACENERO · VENDEDOR → se muestra el aviso. Roles restaurados (`PUT` → 200, ALMACENERO + VENDEDOR). | Pasa | MC-04_permisos-cambiaron.png |

## Resumen

| Grupo | Casos | Pasan | Fallan |
|---|---|---|---|
| Login | 5 (L-01 a L-04, L-05*) | 4 | 1 (L-03 → H-01, corregido) |
| Sesión | 5 (S-01 a S-04, S-05*) | 4 | 1 (S-04 → H-02) |
| Interceptor | 3 (I-01 a I-03) | 3 | 0 |
| Guards | 3 (G-01, G-02, G-03*) | 3 | 0 |
| Menú y acciones | 2 (M-01, M-02) | 2 | 0 |
| 401 / 403 | 2 (E-01, E-02*) | 2 | 0 |
| Aviso de expiración | 5 (B-01 a B-04, B-05*) | 5 | 0 |
| Mi cuenta | 4 (MC-01 a MC-04) | 4 | 0 |
| **Total** | **29** | **27** | **2** |

\* Caso propio.
