import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type UserRole = 'docente' | 'studente';
export type PortalRole = UserRole | 'all';

export interface AuthState {
  authenticated: boolean;
  initialized: boolean;
  username: string;
  fullName: string;
  roles: string[];
}

interface ParsedToken {
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles?: string[] };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly browser: boolean;
  private accessToken = '';
  private idToken = '';
  readonly state = signal<AuthState>({
    authenticated: false,
    initialized: false,
    username: '',
    fullName: '',
    roles: [],
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.browser = isPlatformBrowser(platformId);
  }

  async init(): Promise<void> {
    if (!this.browser || this.state().initialized) {
      this.state.update((current) => ({ ...current, initialized: true }));
      return;
    }

    const fragmentToken = this.extractTokenFromHash();
    const storedToken = this.document.defaultView?.localStorage.getItem('registro_token') ?? '';
    const token = fragmentToken || storedToken;

    if (!token) {
      this.state.set({ authenticated: false, initialized: true, username: '', fullName: '', roles: [] });
      return;
    }

    this.accessToken = token;
    this.document.defaultView?.localStorage.setItem('registro_token', token);

    const payload = this.parseJwt(token);
    if (!payload) {
      this.clearSession();
      return;
    }

    this.state.set({
      authenticated: true,
      initialized: true,
      username: payload.preferred_username ?? '',
      fullName: payload.name ?? (([payload.given_name, payload.family_name].filter(Boolean).join(' ') || payload.preferred_username) ?? ''),
      roles: payload.realm_access?.roles ?? [],
    });
  }

  login(): Promise<void> {
    if (!this.browser) {
      return Promise.resolve();
    }

    const authorizeUrl = new URL(
      `${this.getEnv('keycloakUrl', 'http://localhost:8080').replace(/\/$/, '')}/realms/${this.getEnv('keycloakRealm', 'registro-elettronico')}/protocol/openid-connect/auth`,
    );
    authorizeUrl.searchParams.set('client_id', this.getEnv('keycloakClientId', 'registro-frontend'));
    authorizeUrl.searchParams.set('redirect_uri', this.document.location.origin + this.document.location.pathname);
    authorizeUrl.searchParams.set('response_type', 'token id_token');
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('prompt', 'login');

    this.document.location.href = authorizeUrl.toString();
    return Promise.resolve();
  }

  async logout(): Promise<void> {
    if (!this.browser) {
      return Promise.resolve();
    }

    this.clearSession();
    this.document.defaultView?.localStorage.clear();
    this.document.defaultView?.sessionStorage.clear();

    const logoutUrl = new URL(
      `${this.getEnv('keycloakUrl', 'http://localhost:8080').replace(/\/$/, '')}/realms/${this.getEnv('keycloakRealm', 'registro-elettronico')}/protocol/openid-connect/logout`,
    );

    try {
      await fetch(logoutUrl.toString(), { mode: 'no-cors' });
    } catch {
      // ignore
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.document.location.href = this.document.location.origin + this.document.location.pathname;

    return Promise.resolve();
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  hasRole(role: UserRole): boolean {
    return this.state().roles.includes(role);
  }

  getPortalRole(): PortalRole {
    const configuredRole = this.getEnv('portalRole', 'all').toLowerCase();
    if (configuredRole === 'docente' || configuredRole === 'studente') {
      return configuredRole;
    }
    return 'all';
  }

  getHomeRoute(): string {
    const portalRole = this.getPortalRole();
    if (portalRole === 'docente') {
      return '/docente';
    }
    if (portalRole === 'studente') {
      return '/studente';
    }

    if (this.hasRole('docente')) {
      return '/docente';
    }
    if (this.hasRole('studente')) {
      return '/studente';
    }
    return '/';
  }

  private extractTokenFromHash(): string {
    const hash = this.document.location.hash.replace(/^#/, '');
    if (!hash) {
      return '';
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token') ?? '';
    const idToken = params.get('id_token') ?? '';

    if (accessToken || idToken) {
      this.idToken = idToken;
      this.document.defaultView?.history.replaceState({}, this.document.title, this.document.location.pathname);
    }
    return accessToken;
  }

  private parseJwt(token: string): ParsedToken | null {
    try {
      const [, payload] = token.split('.');
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '='));
      return JSON.parse(json) as ParsedToken;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this.accessToken = '';
    this.idToken = '';
    this.document.defaultView?.localStorage.removeItem('registro_token');
    this.state.set({ authenticated: false, initialized: true, username: '', fullName: '', roles: [] });
  }

  private getEnv(
    key: 'keycloakUrl' | 'keycloakRealm' | 'keycloakClientId' | 'portalRole',
    fallback: string,
  ): string {
    const config = (globalThis as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    return config?.[key] || fallback;
  }
}
