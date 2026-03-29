# Lezione completa su Nginx (Registro Elettronico)

## Parte 1 — Teoria

### 1) Cos'è Nginx
Nginx è un web server e reverse proxy ad alte prestazioni, progettato con architettura event-driven e asincrona.

### 2) Reverse proxy vs web server
- **Web server**: serve file statici (HTML/CSS/JS, immagini).
- **Reverse proxy**: riceve richieste client e le inoltra ai servizi interni (frontend, backend, auth).

### 3) Perché usarlo in architetture a micro-servizi
- Punto unico di ingresso.
- Routing per path (`/docenti`, `/studenti`, `/api`, `/auth`).
- Isolamento servizi interni non esposti direttamente.
- Caching, compressione, rate limiting, TLS termination.

### 4) Flusso richieste nel progetto
1. Utente apre `http://localhost/docenti/` o `http://localhost/studenti/`.
2. Nginx inoltra al frontend Angular corretto.
3. Frontend avvia login su Keycloak (`/auth`).
4. Dopo autenticazione, frontend invia token JWT alle API (`/api`).
5. Flask valida firma, issuer e audience del token.
6. Flask autorizza in base ai ruoli (`docente`, `studente`).

### 5) Concetti da spiegare durante la presentazione
- Differenza tra autenticazione (Keycloak) e autorizzazione (Flask + ruoli).
- Significato di upstream, location, proxy headers.
- Perché il backend usa JWKS di Keycloak per verificare i JWT.
- Importanza di `issuer` coerente tra token e API.

---

## Parte 2 — Pratica (demo guidata)

### Architettura finale realizzata
- `frontend-docente` (Angular) dedicato ai docenti.
- `frontend-studente` (Angular) dedicato agli studenti.
- `backend` Flask + MySQL.
- `keycloak` per autenticazione OIDC.
- `nginx` come gateway unico.

### Routing Nginx implementato
- `/docenti/` -> frontend docenti.
- `/studenti/` -> frontend studenti.
- `/api/` -> backend Flask.
- `/auth/` -> Keycloak.

### Comandi demo
```bash
docker compose up --build -d
docker compose ps
docker compose logs -f nginx backend keycloak
```

### Checklist dimostrazione in classe
1. Accesso da `http://localhost/docenti/` con utente docente.
2. Verifica che il docente possa vedere/inserire voti.
3. Accesso da `http://localhost/studenti/` con utente studente.
4. Verifica che lo studente veda solo i propri voti.
5. Tentativo di accesso incrociato (docente nel portale studenti e viceversa) e verifica blocco.
6. Spiegazione live del file `nginx/nginx.conf`.

### Domande tipiche da preparare
- Perché non esporre backend e keycloak direttamente su porte pubbliche?
- Cosa succede se Nginx cade?
- In che punto aggiungeresti HTTPS?
- Come scaleresti i frontend/backend su più istanze?
