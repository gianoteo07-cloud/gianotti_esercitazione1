import { Routes } from '@angular/router';
import { AccessoNegatoComponent } from './components/accesso-negato/accesso-negato.component';
import { DocenteComponent } from './components/docente/docente.component';
import { HomeComponent } from './components/home/home.component';
import { StudenteComponent } from './components/studente/studente.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'docente', component: DocenteComponent, canActivate: [roleGuard('docente')] },
  { path: 'studente', component: StudenteComponent, canActivate: [roleGuard('studente')] },
  { path: 'accesso-negato', component: AccessoNegatoComponent },
  { path: '**', redirectTo: '' },
];
