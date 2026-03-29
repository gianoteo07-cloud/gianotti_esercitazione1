import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <section class="hero-shell">
      <div class="hero-card">
        <p class="eyebrow">Registro Elettronico</p>
        <h1>{{ title() }}</h1>
        <p>
          Effettua il login per entrare nel pannello {{ subtitle() }}.
        </p>
        <div class="actions">
          <button type="button" class="primary" (click)="login()">Accedi con Keycloak</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero-shell { min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
    .hero-card { max-width: 720px; padding: 3rem; border-radius: 32px; background: rgba(15,23,42,.84); color: white; box-shadow: 0 20px 70px rgba(15,23,42,.32); }
    .eyebrow { text-transform: uppercase; letter-spacing: .2em; color: #93c5fd; }
    h1 { font-size: clamp(2rem, 4vw, 3.8rem); margin: 0 0 1rem; }
    p { color: #dbeafe; line-height: 1.6; }
    .actions { margin-top: 1.5rem; }
    .primary { border: 0; border-radius: 999px; background: linear-gradient(135deg,#38bdf8,#8b5cf6); color: white; padding: .95rem 1.5rem; font-weight: 700; cursor: pointer; }
  `,
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = computed(() => {
    const portalRole = this.authService.getPortalRole();
    if (portalRole === 'docente') {
      return 'Portale Docenti con Angular, Flask, Keycloak e Nginx';
    }
    if (portalRole === 'studente') {
      return 'Portale Studenti con Angular, Flask, Keycloak e Nginx';
    }
    return 'Accesso protetto con Angular, Flask, Keycloak e Nginx';
  });

  readonly subtitle = computed(() => {
    const portalRole = this.authService.getPortalRole();
    if (portalRole === 'docente') {
      return 'docente';
    }
    if (portalRole === 'studente') {
      return 'studente';
    }
    return 'corretto in base al tuo ruolo';
  });

  async ngOnInit(): Promise<void> {
    await this.authService.init();
    if (this.authService.state().authenticated) {
      await this.router.navigateByUrl(this.authService.getHomeRoute());
    }
  }

  login(): void {
    void this.authService.login();
  }
}
