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
  private apiUrl = 'http://localhost:5000/rooms';

  constructor(private http: HttpClient) { }

  // GET tutte le camere
  getCamere(): Observable<Camera[]> {
    return this.http.get<Camera[]>(this.apiUrl);
  }

  // POST nuova camera
  aggiungiCamera(camera: Camera): Observable<any> {
    return this.http.post<any>(this.apiUrl, camera);
  }
}
