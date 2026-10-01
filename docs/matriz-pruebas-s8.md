# Matriz de pruebas S8 — Dependencias entre Categorías y Productos

- **Proyecto:** PharmaSoft (`pharma-frontend`, rama `feature/pruebas-dependencias-tineo`) + Practica (`feature/consultas-reportes`, commit `9c3d4b2`).
- **Fecha de ejecución:** 1 de octubre de 2026 · Oracle local · SPA en `http://localhost:4200` · API en `http://localhost:8080/api/v1`.
- **Medios:** SPA en Chrome; API con la colección `postman/PharmaSoft-S8-Dependencias.json` (variable `baseUrl`), ejecutada con Newman, el motor de línea de comandos de Postman.
- **Evidencias:** `docs/evidencias-s8/<ID>_spa.png` y `docs/evidencias-s8/<ID>_postman.png`. Las capturas de la SPA incluyen debajo el registro de red del caso; cuando la SPA bloquea la operación, el registro aparece vacío.
- **Criterio:** el resultado esperado se deduce de la regla de negocio, no del comportamiento actual. Si el sistema se comporta distinto, el caso **falla** y es un hallazgo.

## Datos de partida

| Categoría | Estado | Productos usados en la matriz |
|---|---|---|
| Medicamentos (64) | Activa | Paracetamol 500mg, Ibuprofeno 400mg, Aspirina 100mg, Naproxeno 550mg (dado de baja en la práctica) |
| Gastrointestinales (85) | Activa | — (destino de C-01) |
| Vitaminas (86) | Activa al inicio | Vitamina C 1g (activo) |
| Temporal S8 (87) | Activa | ninguno |
| Liquidación (88) | Activa | Termómetro digital (dado de baja) |
| Higiene (89) | Activa al inicio | ninguno |
| Dermocosméticos (90) | Activa al inicio | Bloqueador solar FPS 50 (activo) |
| Electronica, Ropa, Hogar | Activas | 7 productos de sesiones anteriores |
| Analgésicos descontinuados (84) | **Inactiva** | ninguno |

## Matriz

| ID | Operación | Precondición | Datos | Resultado esperado (regla) | Resultado obtenido (SPA y HTTP) | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| A-01 | Registrar producto válido en categoría activa | Medicamentos activa; no existe «Omeprazol 20mg» | Omeprazol 20mg · S/ 9.90 · stock 25 · Medicamentos | 201; aparece en el listado con su categoría | SPA: vuelve al listado y la fila muestra «Medicamentos». `POST /productos` **201** | Pasa | A-01_spa.png |
| A-02 | Registrar producto sin elegir categoría | Formulario «Nuevo producto» | Nombre, precio y stock llenos; categoría sin elegir | SPA no envía la petición; por API sin `categoriaId`: 400 | SPA: «Seleccione la categoría del producto.», registro de red vacío. API: **400** con `validationErrors.categoriaId` = «La categoría es obligatoria» | Pasa | A-02_spa.png, A-02_postman.png |
| A-03 | Registrar producto con `categoriaId` 999 | No existe la categoría 999 | Producto de prueba A-03 · categoriaId 999 | 404 «Categoria no encontrada…» | API: **404** «Categoria no encontrada con id: 999» | Pasa | A-03_postman.png |
| A-04 | Registrar producto en categoría inactiva | «Analgésicos descontinuados» (84) inactiva | Producto de prueba A-04 · categoriaId 84 | SPA no la ofrece; por API se rechaza (409) | SPA: el select no incluye la categoría 84. API: **409** «La categoría "Analgésicos descontinuados" está inactiva; elija una categoría activa» | Pasa | A-04_spa.png, A-04_postman.png |
| A-05 | Registrar producto con nombre existente en otra capitalización | Existe «Omeprazol 20mg» | OMEPRAZOL 20MG · Medicamentos | 409 «Ya existe un producto…» | SPA: alerta «Ya existe un producto con el nombre: OMEPRAZOL 20MG». `POST` **409** | Pasa | A-05_spa.png |
| A-06 | Registrar producto con precio 0 y stock −1 | — | precio 0 · stock −1 | SPA bloquea; por API 400 con dos campos en `validationErrors` | SPA: mensajes en precio y stock, registro de red vacío. API: **400** con `precio` y `stock` | Pasa | A-06_spa.png, A-06_postman.png |
| A-07 *(propio)* | Registrar producto con stock decimal | — | stock 2.5 · Medicamentos | El stock es una cantidad entera: 400 | API: **201**; el producto se guardó con `stock: 2` (truncó 2.5 sin avisar) | **Falla → H-02** | A-07_postman.png |
| A-08 *(propio)* | Registrar producto con nombre solo de espacios | — | nombre "     " | 400 con `validationErrors.nombre` | API: **400** con `nombre` | Pasa | A-08_postman.png |
| C-01 | Cambiar la categoría de un producto a otra activa | Omeprazol 20mg en Medicamentos; Gastrointestinales activa | Categoría → Gastrointestinales | 200; el listado muestra la nueva categoría | SPA: fila con «Gastrointestinales». `PUT /productos/53` **200** | Pasa | C-01_spa.png |
| C-02 | Cambiar la categoría de un producto a una inactiva | Omeprazol 20mg en Gastrointestinales; categoría 84 inactiva | categoriaId 84 | SPA lo impide; por API se rechaza (409) | SPA: el select no ofrece la categoría 84. API: `PUT /productos/53` **409** «…está inactiva…» | Pasa | C-02_spa.png, C-02_postman.png |
| C-03 | Desactivar una categoría con productos activos | Vitaminas con «Vitamina C 1g» activo; Dermocosméticos con «Bloqueador solar FPS 50» activo | Estado → inactivo | **Regla elegida (B5-2):** se impide la desactivación mientras tenga productos activos: 409 | SPA: guarda sin aviso, `PUT /categorias/86` **200**. API: `PUT /categorias/90` **200**. Vitamina C 1g y Bloqueador solar quedan **activos dentro de categorías inactivas** | **Falla → H-01** | C-03_spa.png, C-03_postman.png |
| C-04 | Dos pestañas: registrar en una categoría que otra pestaña desactivó | Pestaña 1 con «Nuevo producto» y categoría Higiene elegida | Pestaña 2: Higiene → inactiva. Pestaña 1: Registrar «Jabón antibacterial» | El producto no queda en una categoría inactiva | Pestaña 2: `PUT /categorias/89` **200**. Pestaña 1: `POST /productos` **409** «La categoría "Higiene" está inactiva…»; no se guarda | Pasa | C-04_spa.png |
| C-05 *(propio)* | Actualizar un producto inexistente | No existe el producto 99999 | `PUT /productos/99999` | 404 | API: **404** «Producto no encontrado con id: 99999» | Pasa | C-05_postman.png |
| C-06 *(propio)* | Renombrar un producto con el nombre de otro | Existe «Paracetamol 500mg» | Omeprazol 20mg → nombre «Paracetamol 500mg» | 409 «Ya existe un producto…» | API: **409** «Ya existe un producto con el nombre: Paracetamol 500mg» | Pasa | C-06_postman.png |
| B-01 | Dar de baja un producto activo | Omeprazol 20mg activo | «Dar de baja» + confirmar | 204; la fila pasa a «Inactivo» | SPA: fila «Inactivo» y botón deshabilitado. `DELETE /productos/53` **204** + recarga | Pasa | B-01_spa.png |
| B-02 | Dar de baja otra vez el mismo producto | Omeprazol 20mg inactivo | `DELETE /productos/53` | 409 «…ya se encuentra inactivo» | API: **409** «El producto "Omeprazol 20mg" ya se encuentra inactivo» | Pasa | B-02_postman.png |
| B-03 | Eliminar una categoría sin productos | «Temporal S8» sin productos | «Eliminar» + confirmar | 204; desaparece del listado y del select de Productos | SPA: `DELETE /categorias/87` **204**; no está en Categorías ni en el select de «Nuevo producto» | Pasa | B-03_spa.png |
| B-04 | Eliminar una categoría cuyos productos están todos dados de baja | Liquidación con «Termómetro digital» dado de baja | «Eliminar» + confirmar | **Regla elegida (B5-3):** no se elimina porque esos productos conservan historia (ventas): 409 | SPA: alerta «No se puede eliminar la categoria "Liquidación" porque tiene productos asociados». `DELETE /categorias/88` **409** | Pasa | B-04_spa.png |
| B-05 *(propio)* | Dar de baja un producto inexistente | No existe el producto 99999 | `DELETE /productos/99999` | 404 | API: **404** | Pasa | B-05_postman.png |
| B-06 *(propio)* | Eliminar una categoría inexistente | No existe la categoría 99999 | `DELETE /categorias/99999` | 404 | API: **404** | Pasa | B-06_postman.png |

## Verificación de la parte C

| ID | Operación | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|
| VP-01 | «Ver productos» en la fila Medicamentos | Navega a `/productos?categoriaId=64`, el filtro llega seleccionado y se muestra la nota de los primeros 100 registros | URL `/productos?categoriaId=64`; `GET /productos?pagina=0&tamanio=100…` **200**; solo filas de Medicamentos; nota «Mostrando productos de la categoría Medicamentos en los primeros 100 registros» | Pasa | VP-01_spa.png |

## Resumen

| Grupo | Casos | Pasan | Fallan |
|---|---|---|---|
| Altas (A) | 8 (6 base + 2 propios) | 7 | 1 (A-07) |
| Cambios (C) | 6 (4 base + 2 propios) | 5 | 1 (C-03) |
| Bajas (B) | 6 (4 base + 2 propios) | 6 | 0 |
| **Total** | **20** | **18** | **2** |
