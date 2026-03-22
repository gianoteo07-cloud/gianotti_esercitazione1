import os
from functools import wraps

import jwt
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from jwt import PyJWKClient

from DatabaseWrapper import DatabaseWrapper

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv('CORS_ORIGINS', '*').split(',')}})

ROLE_DOCENTE = 'docente'
ROLE_STUDENTE = 'studente'

KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'registro-elettronico')
KEYCLOAK_AUDIENCE = os.getenv('KEYCLOAK_AUDIENCE', 'registro-frontend')
JWKS_URL = f"{KEYCLOAK_URL.rstrip('/')}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
ISSUER = f"{KEYCLOAK_URL.rstrip('/')}/realms/{KEYCLOAK_REALM}"

_jwk_client = PyJWKClient(JWKS_URL)

try:
    db = DatabaseWrapper(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'registro_db'),
        port=int(os.getenv('DB_PORT', '3306')),
    )
except Exception as exc:
    print(f'Avviso: database non disponibile - {exc}')
    db = None


def extract_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    return auth_header.removeprefix('Bearer ').strip()


def decode_token(token):
    signing_key = _jwk_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=['RS256'],
        audience=KEYCLOAK_AUDIENCE,
        issuer=ISSUER,
    )


def get_realm_roles(payload):
    return payload.get('realm_access', {}).get('roles', [])


def require_roles(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            if db is None:
                return jsonify({'error': 'Database non disponibile'}), 503

            token = extract_token()
            if not token:
                return jsonify({'error': 'Token mancante'}), 401

            try:
                payload = decode_token(token)
            except Exception as exc:
                return jsonify({'error': f'Token non valido: {exc}'}), 401

            roles = get_realm_roles(payload)
            if allowed_roles and not any(role in roles for role in allowed_roles):
                return jsonify({'error': 'Ruolo non autorizzato'}), 403

            request.user = {
                'username': payload.get('preferred_username', ''),
                'name': payload.get('name') or payload.get('given_name') or payload.get('preferred_username', ''),
                'roles': roles,
                'payload': payload,
            }
            return view_func(*args, **kwargs)

        return wrapped

    return decorator


@app.get('/api/health')
def health():
    keycloak_status = 'configured'
    try:
        requests.get(f'{ISSUER}/.well-known/openid-configuration', timeout=3).raise_for_status()
    except Exception:
        keycloak_status = 'unreachable'

    return jsonify(
        {
            'status': 'ok',
            'database': 'connected' if db is not None else 'unavailable',
            'keycloak': keycloak_status,
            'realm': KEYCLOAK_REALM,
        }
    )


@app.get('/api/grades')
@require_roles(ROLE_DOCENTE)
def get_all_grades():
    return jsonify(db.get_all_grades())


@app.post('/api/grades')
@require_roles(ROLE_DOCENTE)
def add_grade():
    data = request.get_json(silent=True) or {}
    required_fields = ['studenteUsername', 'studenteNome', 'materia', 'voto']
    missing = [field for field in required_fields if not str(data.get(field, '')).strip()]
    if missing:
        return jsonify({'error': f"Campi obbligatori mancanti: {', '.join(missing)}"}), 400

    try:
        voto = float(data['voto'])
    except (TypeError, ValueError):
        return jsonify({'error': 'Il voto deve essere numerico'}), 400

    if voto < 1 or voto > 10:
        return jsonify({'error': 'Il voto deve essere compreso tra 1 e 10'}), 400

    grade_id = db.add_grade(
        data['studenteUsername'].strip().lower(),
        data['studenteNome'].strip(),
        data['materia'].strip(),
        voto,
    )
    return jsonify({'message': 'Voto inserito con successo', 'id': grade_id}), 201


@app.get('/api/my-grades')
@require_roles(ROLE_STUDENTE, ROLE_DOCENTE)
def get_my_grades():
    grades = db.get_grades_for_student(request.user['username'])
    return jsonify(grades)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=True)
