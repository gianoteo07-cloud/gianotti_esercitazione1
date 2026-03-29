# Registro Elettronico con Angular, Flask, Keycloak, MySQL e Nginx

Questa versione del progetto implementa l'architettura richiesta dall'esercizio:

- due frontend Angular separati:
  - `frontend-docente` (path `/docenti/`)
  - `frontend-studente` (path `/studenti/`)
- backend Flask con API protette da JWT Keycloak
- database MySQL
- Keycloak come identity provider
- Nginx come reverse proxy/gateway unico

## Avvio rapido

```bash
docker compose up --build -d
```

Poi apri:
- Portale docenti: http://localhost/docenti/
- Portale studenti: http://localhost/studenti/
- Keycloak (passando da Nginx): http://localhost/auth/

## Struttura routing Nginx

- `/docenti/` -> `frontend-docente`
- `/studenti/` -> `frontend-studente`
- `/api/` -> `backend`
- `/auth/` -> `keycloak`

La configurazione è in `nginx/nginx.conf`.

## Materiale lezione

La traccia completa della lezione teorica+pratica è disponibile in:

- `docs/lezione-nginx.md`
