# Matriz de pruebas S9 — Registro de ventas

- **Proyecto:** PharmaSoft (`pharma-frontend`, rama `feature/pruebas-reporte-ventas-tineo`) + Practica (`feature/consultas-reportes`, commit `e409962`).
- **Fecha de ejecución:** 8 de octubre de 2026 · Oracle local · SPA en `http://localhost:4200` · API en `http://localhost:8080/api/v1`.
- **Medios:** SPA en Chrome; API con la colección `postman/PharmaSoft-S9-Ventas.json` (variable `baseUrl`), ejecutada con Newman, el motor de línea de comandos de Postman.
- **Evidencias:** `docs/evidencias-s9/<ID>_spa.png` y `docs/evidencias-s9/<ID>_postman.png`. Cada captura de la SPA lleva debajo el registro de red del caso; cuando la SPA bloquea la operación, el registro aparece vacío. En los cálculos, la operación hecha a mano está escrita en la propia evidencia.
- **Criterio:** el resultado esperado sale de la regla de negocio; si el sistema hace otra cosa, el caso **falla** y es un hallazgo.

## Datos de partida

| Dato | Valor |
|---|---|
| Cliente activo usado | Quispe Huamán, María (id 26, DNI 71000001) |
| Otros clientes activos | Pérez Gómez Juan Carlos, Alvarez Medina Ana, Castillo Soto Pedro, entre otros |
| Cliente inactivo | Aguilar Pinto, Valeria (DNI 72345678) |
| Producto S/ 12.50 | Loratadina 10mg (id 57, Antialérgicos, stock 50) |
| Producto con decimales S/ 18.90 | Amoxicilina 500mg (id 58, Antibióticos, stock 40) |
| Producto S/ 1.10 (caso propio de redondeo) | Gasa estéril (id 59, Medicamentos, stock 100) |
| Producto con stock 2 | Jarabe para la tos 120ml (id 56, S/ 12.90) |
| Otros productos activos con stock | Paracetamol 500mg, Aspirina 100mg, Ibuprofeno 400mg, Laptop Lenovo, Smartphone Samsung, Lámpara de Escritorio, Casaca de Cuero, Polo de Algodón… |
| Venta anulada previa | N.º 21 |

## Matriz

| ID | Grupo | Precondición | Datos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| B-01 | Buscadores | Formulario «Nueva venta» | DNI 72345678 (inactivo); luego «huaman» | El inactivo no aparece («Ningún cliente activo coincide…»); el activo sí | DNI inactivo: «Ningún cliente activo coincide con la búsqueda.» · «huaman»: «Quispe Huamán, María · DNI 71000001». Sin peticiones extra (filtra en memoria) | Pasa | B-01_spa.png |
| B-02 | Buscadores | Cliente elegido | «lorat» (parte del nombre); «antibiot» (categoría) + Enter | Se listan los que coinciden con precio y stock; Enter agrega el primero sin abrir el resumen | «lorat» → Loratadina 10mg · S/ 12.50 · Stock 50. «antibiot» → Amoxicilina 500mg · Antibióticos · S/ 18.90 · Stock 40. Enter: 1 línea creada, resumen no se abre, sin POST | Pasa | B-02_spa.png |
| B-03 *(propio)* | Buscadores | Cliente elegido | «para 500» (dos palabras) | Encuentra «Paracetamol 500mg» (todas las palabras en algún campo) | Paracetamol 500mg · Medicamentos · S/ 5.50 · Stock 41 | Pasa | B-03_spa.png |
| C-01 | Cálculos | Cliente elegido | Loratadina S/ 12.50 × 3 | **12.50 × 3 = 37.50**; total 37.50 | Subtotal S/ 37.50 · total S/ 37.50 | Pasa | C-01_spa.png |
| C-02 | Cálculos | Cliente elegido | Amoxicilina S/ 18.90 × 3 | **18.90 × 3 = 56.70** exacto, sin decimales extra | Subtotal S/ 56.70 · total S/ 56.70 (en JavaScript sin redondear: 18.9 * 3 = 56.699999999999996; `redondear()` lo corrige) | Pasa | C-02_spa.png |
| C-03 | Cálculos | Cliente elegido | Loratadina × 1, Amoxicilina × 2, Gasa × 3; quitar la del medio | **12.50 + 37.80 + 3.30 = 53.60**; sin la del medio **12.50 + 3.30 = 15.80** | Total con 3 líneas S/ 53.60 · tras quitar Amoxicilina S/ 15.80 | Pasa | C-03_spa.png |
| C-04 | Cálculos | Venta de C-03 armada | Revisar → Confirmar (sin imprimir) | Total del comprobante (servidor) = total estimado **15.80** | `POST /ventas` **201**, venta N.º 25; comprobante S/ 15.80 = estimado S/ 15.80 | Pasa | C-04_spa.png |
| C-05 *(propio)* | Cálculos | Cliente elegido | Gasa S/ 1.10 × 3 | **1.10 × 3 = 3.30** (sin 3.3000000000000003) | Subtotal S/ 3.30 (JavaScript sin redondear: 3.3000000000000003) | Pasa | C-05_spa.png |
| V-01 | Validaciones | Formulario vacío | «Revisar venta» | Mensajes en cliente y en el detalle vacío; no aparece el resumen. Por API: 400 | SPA: «Busque y seleccione el cliente.» y «Agregue al menos un producto…»; sin resumen ni peticiones. API: **400** con `clienteId` y `detalles` | Pasa | V-01_spa.png, V-01_postman.png |
| V-02 | Validaciones | Cliente y Gasa en el detalle | Cantidad 0; luego 2.5 | Mensaje de cantidad entera mayor que cero en ambos casos; por API 400 en ambos | SPA: mensaje y sin resumen en ambos casos. API: cantidad 0 → **400** «La cantidad debe ser mayor que cero»; cantidad 2.5 → **201**, venta N.º 26 guardada con **cantidad 2** | **Falla → H-03** (solo la parte API con 2.5) | V-02_spa.png, V-02a_postman.png, V-02b_postman.png |
| V-03 | Validaciones | Jarabe con stock 2 | Cantidad 3 | Aviso «Supera el stock (2)»; por API 409 | SPA: «Supera el stock (2)», resumen no se abre. API: **409** «Stock insuficiente para Jarabe para la tos 120ml. Disponible: 2, solicitado: 3» | Pasa | V-03_spa.png, V-03_postman.png |
| V-04 | Validaciones | Loratadina ya en la venta (cantidad 1) | Buscar «lorat» y elegirla otra vez | «En la venta: 1»; la cantidad sube a 2 y no se crea otra línea | Aviso «En la venta: 1» · 1 línea · cantidad 2 | Pasa | V-04_spa.png |
| V-05 | Validaciones | — | Por API: Loratadina en dos líneas (1 y 2) | **Regla elegida:** el detalle no admite productos repetidos → 400 (la SPA ya los agrupa en una línea) | API: **201**, venta N.º 27 con dos líneas de Loratadina (1 × 12.50 y 2 × 25.00); stock 49 → 46 | **Falla → H-04** | V-05_postman.png |
| F-01 | Confirmación | Venta válida armada | «Revisar venta» → «Volver» | Se cierra el resumen; ningún POST | Resumen cerrado; registro de red vacío | Pasa | F-01_spa.png |
| F-02 | Confirmación | Resumen abierto | Doble clic en «Confirmar venta» | Se registra **una sola** venta (el botón se deshabilita) | **2 POST → 201 y 201**: ventas N.º 28 y 29 idénticas (misma fecha, Loratadina × 1, S/ 12.50) | **Falla → H-01** | F-02_spa.png |
| F-03 *(propio)* | Confirmación | Resumen abierto con Loratadina × 1 | Cambiar la cantidad a 0 y pulsar «Confirmar venta» | Con el resumen abierto no se puede enviar un formulario inválido (no hay POST) | El formulario sigue editable; se envió `POST /ventas` → **400** y se mostró «Existen errores de validación» | **Falla → H-02** | F-03_spa.png |
| M-01 | Mensajes | Jarabe con stock 2; dos pestañas con la misma venta (2 unidades) | Confirmar en la pestaña 1 y luego en la 2 | La segunda recibe 409 con el mensaje de stock; puede corregir sin recargar | Pestaña 1: **201** (venta N.º 30). Pestaña 2: **409** con el mensaje de stock; se quitó el jarabe, se agregó Loratadina y se registró la venta N.º 31 sin recargar. Stock final del jarabe: 0 | Pasa | M-01_spa.png |
| M-02 | Mensajes | Cliente inactivo (DNI 72345678) | Por API, venta con Loratadina × 1 | 409 «No se puede registrar una venta para un cliente inactivo» | API: **409** con ese mensaje exacto | Pasa | M-02_postman.png |
| M-03 *(propio)* | Mensajes | No existe el producto 99999 | Por API, venta con productoId 99999 | 404 «Producto no encontrado…» | API: **404** «Producto no encontrado con id: 99999» | Pasa | M-03_postman.png |
| I-01 | Impresión | Ventas registradas y venta N.º 21 anulada | Imprimir al registrar (venta N.º 32), 🖨️ de la N.º 21 y consulta filtrada (cliente + desde hoy); guardar como PDF | Sin menú ni botones; comprobante con DNI y pie; anulada con sello; consulta con resumen de filtros | `window.print()` se llamó en los tres casos. PDF: `I-01_al-registrar.pdf` (DNI 71000001 y pie), `I-01_anulada.pdf` (sello ANULADA), `I-01_consulta.pdf` (resumen de filtros y total de la página) | Pasa | I-01_spa.png + 3 PDF |
| X-01 | Consistencia | Venta N.º 25 de C-04 registrada | Revisar Productos y la consulta | El stock bajó (**Loratadina 50 − 1 = 49; Gasa 100 − 3 = 97**); la venta aparece con el mismo total y número de ítems | Loratadina 49 · Gasa 97 · consulta: venta 25 con 2 ítems y S/ 15.80 | Pasa | X-01_spa.png |
| X-02 *(propio)* | Consistencia | Venta N.º 32 (Amoxicilina × 1) registrada | Por API `PATCH /ventas/32/anular`; revisar stock, consulta y reporte | Estado ANULADA, **stock 39 + 1 = 40**, y la venta deja de sumar en el reporte | API: **200** estado ANULADA · stock de Amoxicilina 40 · consulta muestra ANULADA · el reporte histórico ya no incluye Antibióticos | Pasa | X-02_postman.png, X-02_spa.png, RP-01_spa.png |

## Parte B: verificación del reporte

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| RP-01 | Sin fechas (histórico) | `GET /reportes/ventas-por-categoria` sin parámetros → 200; Medicamentos 21 u. S/ 122.50 (barra 100 %), Antialérgicos 7 u. S/ 87.50 (barra 87.50 / 122.50 = 71.4 %); totales 28 u. y S/ 210.00 | RP-01_spa.png |
| RP-02 | Solo hoy | `?desde=2026-10-08&hasta=2026-10-08` → 200 | RP-02_spa.png |
| RP-03 | Periodo sin ventas (enero 2020) | 200 con lista vacía → «No hay ventas en el periodo seleccionado.» | RP-03_spa.png |
| RP-04 | «Desde» posterior a «hasta» | Mensaje en la SPA, sin petición | RP-04_spa.png |

## Resumen

| Grupo | Casos | Pasan | Fallan |
|---|---|---|---|
| Buscadores (B) | 3 (2 base + 1 propio) | 3 | 0 |
| Cálculos (C) | 5 (4 base + 1 propio) | 5 | 0 |
| Validaciones (V) | 5 (5 base) | 3 | 2 (V-02, V-05) |
| Confirmación (F) | 3 (2 base + 1 propio) | 1 | 2 (F-02, F-03) |
| Mensajes (M) | 3 (2 base + 1 propio) | 3 | 0 |
| Impresión (I) | 1 (base) | 1 | 0 |
| Consistencia (X) | 2 (1 base + 1 propio) | 2 | 0 |
| **Total** | **22 (17 base + 5 propios)** | **18** | **4** |
