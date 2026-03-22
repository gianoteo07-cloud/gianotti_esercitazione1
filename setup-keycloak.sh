#!/bin/bash

# Ottieni token admin
echo "Ottengo il token admin..."
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."

# Crea il realm
echo "Creando il realm registro-elettronico..."
curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "registro-elettronico",
    "enabled": true,
    "displayName": "Registro Elettronico"
  }' && echo -e "\n✓ Realm creato!\n"

# Crea il client
echo "Creando il client registro-frontend..."
curl -X POST http://localhost:8080/admin/realms/registro-elettronico/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "registro-frontend",
    "name": "Registro Frontend",
    "enabled": true,
    "publicClient": true,
    "redirectUris": [
      "http://localhost:4200/*"
    ],
    "webOrigins": [
      "http://localhost:4200"
    ]
  }' && echo -e "\n✓ Client creato!\n"

# Crea i realm roles
echo "Creando i ruoli..."
curl -X POST http://localhost:8080/admin/realms/registro-elettronico/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "studente",
    "description": "Ruolo Studente"
  }' && echo -e "\n✓ Ruolo 'studente' creato!"

curl -X POST http://localhost:8080/admin/realms/registro-elettronico/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "professore",
    "description": "Ruolo Professore"
  }' && echo -e "\n✓ Ruolo 'professore' creato!\n"

echo "✓ Setup completato!"
