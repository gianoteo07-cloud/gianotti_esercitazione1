#!/bin/bash

# Ottieni token admin
echo "Ottengo il token admin..."
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token ottenuto: ${TOKEN:0:20}..."

# Ottieni tutti i client
echo "Cercando il client registro-frontend..."
RESPONSE=$(curl -s "http://localhost:8080/admin/realms/registro-elettronico/clients" \
  -H "Authorization: Bearer $TOKEN")

# Estrai CLIENT_ID (questo è un workaround senza jq)
CLIENT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | grep -m1 -o '[^:"]*"*$' | head -1 | tr -d '"')

echo "Client ID: $CLIENT_ID"

if [ -z "$CLIENT_ID" ] || [ ${#CLIENT_ID} -lt 5 ]; then
  echo "Errore: Client ID non trovato"
  echo "Response: $RESPONSE"
  exit 1
fi

# Aggiorna il client con i correct redirect URIs
echo "Aggiornando il client con redirect URIs..."
curl -X PUT "http://localhost:8080/admin/realms/registro-elettronico/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "registro-frontend",
    "name": "Registro Frontend",
    "enabled": true,
    "publicClient": true,
    "redirectUris": [
      "http://localhost:4200/",
      "http://localhost:4200",
      "http://localhost:4200/*"
    ],
    "webOrigins": [
      "http://localhost:4200",
      "http://localhost:4200/"
    ]
  }' && echo -e "\n✓ Client aggiornato!"
