import { expect, test } from '@playwright/test';
import { API, iniciarSesion, productoApi, tokenApi } from './apoyo';

test('E2E-12 la venta registrada aparece en la bitácora con su requestId', async ({ page, request }) => {
  // Venta del vendedor (por la API, para conocer su id y su X-Request-Id)
  const token = await tokenApi(request, 'vendedor');
  const gasa = await productoApi(request, token, 'Gasa');
  const venta = await request.post(`${API}/ventas`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { clienteId: 22, detalles: [{ productoId: gasa.id, cantidad: 1 }] },
  });
  expect(venta.status()).toBe(201);
  const ventaId = String((await venta.json()).id);
  const requestId = venta.headers()['x-request-id'];

  await iniciarSesion(page, 'admin', '/auditoria?accion=VENTA_REGISTRADA&usuario=vendedor');
  const fila = page.getByTestId('tabla-auditoria').locator('tbody tr').first();
  await expect(fila).toContainText('vendedor');
  await expect(fila).toContainText('VENTA_REGISTRADA');
  await expect(fila).toContainText(ventaId);
  await expect(fila).toContainText(requestId);
});

test('E2E-13 el vendedor no ve Auditoría y la URL directa es denegada', async ({ page }) => {
  await iniciarSesion(page, 'vendedor');
  await expect(page.getByRole('link', { name: 'Auditoría' })).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { name: /Acceso denegado/ })).toBeVisible();
});
