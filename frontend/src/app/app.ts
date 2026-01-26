import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, Camera } from './services/room.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  camere: Camera[] = [];
  nuovaCamera: Camera = {
    numero: '',
    tipologia: '',
    prezzo: 0
  };
  caricamento = false;
  messaggio = '';
  tipoMessaggio = '';

  constructor(private roomService: RoomService) {}

  ngOnInit() {
    this.caricaCamere();
  }

  caricaCamere() {
    this.caricamento = true;
    this.roomService.getCamere().subscribe({
      next: (camere) => {
        this.camere = camere;
        this.caricamento = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento delle camere:', err);
        this.mostraMessaggio('Errore nel caricamento delle camere', 'danger');
        this.caricamento = false;
      }
    });
  }

  aggiungiCamera() {
    // Validazione
    if (!this.nuovaCamera.numero.trim() || !this.nuovaCamera.tipologia.trim() || this.nuovaCamera.prezzo <= 0) {
      this.mostraMessaggio('Completa tutti i campi correttamente', 'warning');
      return;
    }

    this.caricamento = true;
    this.roomService.aggiungiCamera(this.nuovaCamera).subscribe({
      next: (risposta) => {
        this.mostraMessaggio('Camera aggiunta con successo!', 'success');
        this.nuovaCamera = { numero: '', tipologia: '', prezzo: 0 };
        this.caricaCamere();
      },
      error: (err) => {
        console.error('Errore nell\'aggiunta della camera:', err);
        const messaggioErrore = err.error?.error || 'Errore nell\'aggiunta della camera';
        this.mostraMessaggio(messaggioErrore, 'danger');
        this.caricamento = false;
      }
    });
  }

  mostraMessaggio(testo: string, tipo: string) {
    this.messaggio = testo;
    this.tipoMessaggio = tipo;
    setTimeout(() => {
      this.messaggio = '';
    }, 3000);
  }

  getStatoCamera(camera: Camera): string {
    return camera.occupata ? 'Occupata' : 'Libera';
  }

  getClasseBordo(camera: Camera): string {
    return camera.occupata ? 'border-red' : 'border-green';
  }
}
