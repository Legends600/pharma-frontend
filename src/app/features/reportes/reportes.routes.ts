import { Routes } from '@angular/router';
import { VentasCategoria } from './pages/ventas-categoria/ventas-categoria';

export const REPORTES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ventas-por-categoria' },
  { path: 'ventas-por-categoria', component: VentasCategoria, title: 'Ventas por categoría' },
];
