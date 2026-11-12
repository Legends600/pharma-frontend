# Registro de incidencias · Sesión 14

Integración y estabilización de PharmaSoft. Cada defecto se registró antes de corregirlo y siguió el mismo ciclo: reproducir → identificar la prueba o la fila de la matriz que falla → corregir la causa → ejecutar toda la suite → commit `fix(...)`/`perf(...)` con el ID.

Repositorios: **fe** = `pharma-frontend`, **be** = `PharmaBackend` (proyecto `Practica`). Rama `feature/integracion-estabilizacion-tineo` en ambos.

| ID | Módulo | Descripción y pasos | Severidad | Causa | Corrección (commit) | Estado |
|---|---|---|---|---|---|---|
| INC-01 | Productos (SPA) | Con 5 020 productos la lista mostraba 10 filas por página y el estado vivía en *signals*: admin → Productos → «Siguiente» no cambiaba la URL y F5 volvía a la página 1. El filtro de categoría solo filtraba la página que ya estaba en el navegador. | Media | Página, tamaño y orden en *signals* del componente; filtro de categoría aplicado en el cliente. | `feat(productos)` fe `038a254` · `feat(productos)` be `3b7e589` | Cerrada |
| INC-02 | Base de datos | El índice de la guía `ix_productos_nombre (nombre)` no se usaba: `EXPLAIN PLAN` de una página ordenada por nombre muestra `TABLE ACCESS FULL` + `WINDOW SORT PUSHED RANK` sobre 5 020 filas (costo 16). | Media | La consulta ordena por `nombre, id` (desempate entre páginas) y el índice solo tenía `nombre`. | `perf(db)` be `d2a7b14` (V4: índice `(nombre, id)` → `INDEX FULL SCAN` + `WINDOW NOSORT STOPKEY`, costo 4) | Cerrada |
| INC-03 | Backend (listados) | N+1: una página de `GET /ventas/buscar` (10 filas) lanzaba 16 sentencias, 10 de ellas `select … from detalle_venta where venta_id=?`; la de productos, una por categoría. | Media | Relaciones perezosas cargadas fila por fila al convertir cada entidad a DTO. | `fix(listados)` be `f4c072b` (`default_batch_fetch_size = 50`: 7 sentencias por página) | Cerrada |
| INC-04 | Ventas (nueva venta) | Con el volumen cargado, buscar «Producto de prueba 04984» en la nueva venta respondía «Ningún producto activo con stock coincide»: no se podía vender ese producto. | Alta | Al abrir la página se descargaban los 100 primeros productos por nombre y la búsqueda filtraba solo esos en el navegador. | `feat(productos)` be `3b7e589` (filtros `nombre`, `categoriaId`, `disponibles`) · fe `038a254` (búsqueda en el servidor con 300 ms de espera) | Cerrada |
| INC-05 | Pruebas E2E | Con el aviso de expiración visible, `iniciarSesion` fallaba con *strict mode violation*: `getByRole('button', { name: 'Cerrar sesión' })` encontraba también «Cerrar sesión ahora». Se reprodujo al recorrer I-07 con tokens de 1 minuto. | Baja | Localizador por subcadena. | `fix(e2e)` fe `8d64b0b` (`exact: true`) | Cerrada |
| INC-06 | Ventas · Seguridad (I-07) | Vendedor en `/ventas/nueva` con cliente y producto elegidos; el token vence (1 min) → login con «Su sesión expiró» → tras entrar vuelve a `/ventas/nueva`, pero la venta llega vacía. | Media | El formulario de la venta solo existía en memoria y se destruía al cerrar la sesión. | `fix(ventas)` fe `bbe5290` (borrador en `sessionStorage`, solo para el mismo usuario; se borra al registrar o cancelar) | Cerrada |
| INC-07 | Ventas · Clientes | La nueva venta y el filtro de la consulta de ventas descargan los 100 primeros clientes por apellido. Hoy hay 16 clientes y I-01 se cumple, pero con más de 100 un cliente recién registrado podría no aparecer en el buscador. | Baja | Mismo patrón que INC-04, aún no aplicado a clientes. | Pendiente: filtro de texto en `GET /clientes` y búsqueda en el servidor, como en productos. | Abierta |

## Criterios de estabilidad

| Criterio | Resultado | Evidencia |
|---|---|---|
| Las 7 pruebas E2E pasan tres veces seguidas sin reintentos (`npx playwright test --repeat-each=3`, `retries: 0`) | 21/21 | Consola e informe HTML de Playwright |
| No quedan incidencias críticas ni altas abiertas | 0 críticas, 0 altas abiertas (INC-07, baja, abierta) | Esta tabla |
| La consola del navegador no muestra errores y el backend no registra respuestas 500 durante el flujo principal | 0 errores en consola · 0 respuestas 5xx y 0 líneas `ERROR` en el log | DevTools (Console) y log del backend |
