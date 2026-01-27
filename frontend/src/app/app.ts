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

  // Variabili per modal check-in
  mostraModalCheckIn = false;
  cameraSelezionataCheckIn: Camera | null = null;
  nuovoOspite = {
    nome: '',
    cognome: ''
  };

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

  apriModalCheckIn(camera: Camera) {
    this.cameraSelezionataCheckIn = camera;
    this.nuovoOspite = { nome: '', cognome: '' };
    this.mostraModalCheckIn = true;
  }

  chiudiModalCheckIn() {
    this.mostraModalCheckIn = false;
    this.cameraSelezionataCheckIn = null;
    this.nuovoOspite = { nome: '', cognome: '' };
  }

  effettuaCheckIn() {
    if (!this.nuovoOspite.nome.trim() || !this.nuovoOspite.cognome.trim()) {
      this.mostraMessaggio('Inserisci nome e cognome dell\'ospite', 'warning');
      return;
    }

    if (!this.cameraSelezionataCheckIn || !this.cameraSelezionataCheckIn.id) {
      this.mostraMessaggio('Errore: camera non valida', 'danger');
      return;
    }

    this.caricamento = true;
    this.roomService.checkIn(
      this.cameraSelezionataCheckIn.id,
      this.nuovoOspite.nome.trim(),
      this.nuovoOspite.cognome.trim()
    ).subscribe({
      next: () => {
        this.mostraMessaggio('Check-in effettuato con successo!', 'success');
        this.chiudiModalCheckIn();
        this.caricaCamere();
      },
      error: (err) => {
        console.error('Errore nel check-in:', err);
        const messaggioErrore = err.error?.error || 'Errore nel check-in';
        this.mostraMessaggio(messaggioErrore, 'danger');
        this.caricamento = false;
      }
    });
  }

  effettuaCheckOut(camera: Camera) {
    if (!camera.id) {
      this.mostraMessaggio('Errore: camera non valida', 'danger');
      return;
    }

    if (!confirm(`Confermi il check-out per la camera ${camera.numero}?`)) {
      return;
    }

    this.caricamento = true;
    this.roomService.checkOut(camera.id).subscribe({
      next: () => {
        this.mostraMessaggio('Check-out effettuato con successo!', 'success');
        this.caricaCamere();
      },
      error: (err) => {
        console.error('Errore nel check-out:', err);
        const messaggioErrore = err.error?.error || 'Errore nel check-out';
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
