# Registro de incidencias

El registro completo de las sesiones 13 y 14 (INC-01 a INC-09, con fecha, pasos, resultado esperado y obtenido, causa raíz, corrección, commit, prueba que evita que vuelva y el resumen por severidad y módulo) está en el repositorio del backend:

**https://github.com/Legends600/TareaS1/blob/develop/docs/incidencias.md**

Incidencias corregidas en este repositorio:

| ID | Módulo | Severidad | Commit | Prueba |
|---|---|---|---|---|
| INC-01 | Productos (SPA): página solo en un *signal*, F5 volvía a la página 1 | Media | `038a254` | E2E-06, E2E-11 |
| INC-04 | Nueva venta: el buscador solo veía los 100 primeros productos | Alta | `038a254` | E2E-07, E2E-08, E2E-10 |
| INC-05 | Pruebas E2E: localizador ambiguo de «Cerrar sesión» | Baja | `8d64b0b` | Toda la suite |
| INC-06 | Nueva venta: se perdía al vencer el token | Media | `bbe5290` | E2E-15 |

Abierta en este repositorio: INC-07 (baja), los buscadores de clientes descargan 100 clientes.
