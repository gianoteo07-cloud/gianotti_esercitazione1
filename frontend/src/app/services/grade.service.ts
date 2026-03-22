import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grade, GradePayload } from '../models/grade';

@Injectable({ providedIn: 'root' })
export class GradeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = this.resolveApiUrl();

  getAllGrades(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}/grades`);
  }

  getMyGrades(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}/my-grades`);
  }

  addGrade(payload: GradePayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.apiUrl}/grades`, payload);
  }

  private resolveApiUrl(): string {
    const configuredUrl = (globalThis as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__?.['apiUrl'];
    return configuredUrl?.replace(/\/$/, '') || 'http://localhost:5000/api';
  }
}
