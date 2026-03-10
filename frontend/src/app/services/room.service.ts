import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Camera {
  id?: number;
  numero: string;
  tipologia: string;
  prezzo: number;
  occupata?: boolean;
  ospite_nome?: string;
  ospite_cognome?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = this.resolveApiUrl();

  constructor(private http: HttpClient) { }

  private resolveApiUrl(): string {
    const configuredUrl = (globalThis as { __API_URL__?: string }).__API_URL__;

    if (configuredUrl && configuredUrl.trim().length > 0) {
      return `${configuredUrl.replace(/\/$/, '')}/rooms`;
    }

    return 'http://localhost:5000/rooms';
  }

  // GET tutte le camere
  getCamere(): Observable<Camera[]> {
    return this.http.get<Camera[]>(this.apiUrl);
  }

  // POST nuova camera
  aggiungiCamera(camera: Camera): Observable<any> {
    return this.http.post<any>(this.apiUrl, camera);
  }

  // PUT check-in ospite
  checkIn(cameraId: number, ospiteNome: string, ospiteCognome: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${cameraId}/checkin`,
      { ospite_nome: ospiteNome, ospite_cognome: ospiteCognome }
    );
  }

  // PUT check-out ospite
  checkOut(cameraId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${cameraId}/checkout`, {});
  }
}
