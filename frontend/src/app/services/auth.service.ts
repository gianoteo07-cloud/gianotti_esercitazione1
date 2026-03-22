import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type UserRole = 'docente' | 'studente';

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

    console.log('Auth Init - Fragment Token:', !!fragmentToken);
    console.log('Auth Init - Stored Token:', !!storedToken);
    console.log('Auth Init - Using Token:', !!token);
    console.log('Auth Init - URL Hash:', this.document.location.hash.substring(0, 100));

    if (!token) {
      console.log('Auth Init - No token found, setting unauthenticated');
      this.state.set({ authenticated: false, initialized: true, username: '', fullName: '', roles: [] });
      return;
    }

    this.accessToken = token;
    this.document.defaultView?.localStorage.setItem('registro_token', token);

    const payload = this.parseJwt(token);
    console.log('Auth Init - Parsed Payload:', !!payload, payload?.preferred_username);
    
    if (!payload) {
      console.log('Auth Init - Failed to parse token');
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
    console.log('Auth Init - Successfully authenticated as:', payload.preferred_username);
  }

  login(): Promise<void> {
    if (!this.browser) {
      return Promise.resolve();
    }

    const authorizeUrl = new URL(
      `${this.getEnv('keycloakUrl', 'http://localhost:8080').replace(/\/$/, '')}/realms/${this.getEnv('keycloakRealm', 'registro-elettronico')}/protocol/openid-connect/auth`,
    );
    authorizeUrl.searchParams.set('client_id', this.getEnv('keycloakClientId', 'registro-frontend'));
    authorizeUrl.searchParams.set('redirect_uri', this.document.location.origin);
    authorizeUrl.searchParams.set('response_type', 'token id_token');
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('prompt', 'login');

    console.log('Login URL:', authorizeUrl.toString().substring(0, 200));
    this.document.location.href = authorizeUrl.toString();
    return Promise.resolve();
  }

  async logout(): Promise<void> {
    if (!this.browser) {
      return Promise.resolve();
    }

    // First, clear the local session completely
    this.clearSession();
    
    // Make sure localStorage is completely clear
    this.document.defaultView?.localStorage.clear();
    
    // Make sure sessionStorage is clear too
    this.document.defaultView?.sessionStorage.clear();

    // Do the remote logout in the background
    const logoutUrl = new URL(
      `${this.getEnv('keycloakUrl', 'http://localhost:8080').replace(/\/$/, '')}/realms/${this.getEnv('keycloakRealm', 'registro-elettronico')}/protocol/openid-connect/logout`,
    );
    
    // Fire and forget the logout request
    try {
      await fetch(logoutUrl.toString(), { mode: 'no-cors' });
    } catch {
      // Ignore errors from remote logout
    }
    
    // Finally, reload the page completely to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 500));
    this.document.location.href = this.document.location.origin;
    
    return Promise.resolve();
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  hasRole(role: UserRole): boolean {
    return this.state().roles.includes(role);
  }

  getHomeRoute(): string {
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

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getEnv(key: 'keycloakUrl' | 'keycloakRealm' | 'keycloakClientId', fallback: string): string {
    const config = (globalThis as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    return config?.[key] || fallback;
  }
}
