#import dellla classe Flask da flask
from flask import Flask, request, jsonify
from flask_cors import CORS
from DatabaseWrapper import DatabaseWrapper
import os
#inizializziamo flask
#app rappresenta il nostro server
app = Flask(__name__)
CORS(app)

#inizializziamo il wrapper del database
try:
    db = DatabaseWrapper(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "bb_db"),
        port=int(os.getenv("DB_PORT", "3306"))
    )
except Exception as e:
    print(f"Avviso: Impossibile connettere al database - {e}")
    db = None

#il decoratore route definisce gli ENDPOINT
#"quando siamo alla route "/" richiama il metodo associato"
@app.route("/")
def index():
#ora una stringa, dopo un json, prossimamente una select da un db
    data = "ciao mondo"
    return data


#GET /rooms: legge tutte le camere dal DB e le restituisce come lista JSON
@app.route("/rooms", methods=["GET"])
def get_rooms():
    try:
        if db is None:
            return jsonify({"error": "Database non disponibile"}), 503
        camere = db.get_camere()
        return jsonify(camere), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#POST /rooms: riceve un JSON dal frontend, lo valida e lo inserisce nel DB
@app.route("/rooms", methods=["POST"])
def add_room():
    try:
        if db is None:
            return jsonify({"error": "Database non disponibile"}), 503
        
        #ottiene i dati JSON dalla richiesta
        data = request.get_json()
        
        #validazione dei dati richiesti
        if not data:
            return jsonify({"error": "Nessun dato fornito"}), 400
        
        #verifica la presenza dei campi obbligatori
        required_fields = ['numero', 'tipologia', 'prezzo']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                return jsonify({"error": f"Campo '{field}' è obbligatorio"}), 400
        
        #validazione del prezzo (deve essere un numero positivo)
        try:
            prezzo = float(data['prezzo'])
            if prezzo <= 0:
                return jsonify({"error": "Il prezzo deve essere positivo"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Il prezzo deve essere un numero valido"}), 400
        
        #inserisce la camera nel database
        numero = data['numero'].strip()
        tipologia = data['tipologia'].strip()
        
        db.aggiungi_camera(numero, tipologia, prezzo)
        
        return jsonify({"message": "Camera aggiunta con successo", "numero": numero}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /rooms/<id>/checkin: registra il check-in di un ospite
@app.route("/rooms/<int:room_id>/checkin", methods=["PUT"])
def check_in(room_id):
    try:
        if db is None:
            return jsonify({"error": "Database non disponibile"}), 503
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Nessun dato fornito"}), 400
        
        # Verifica i campi obbligatori
        if 'ospite_nome' not in data or 'ospite_cognome' not in data:
            return jsonify({"error": "Nome e cognome ospite sono obbligatori"}), 400
        
        ospite_nome = data['ospite_nome'].strip()
        ospite_cognome = data['ospite_cognome'].strip()
        
        if not ospite_nome or not ospite_cognome:
            return jsonify({"error": "Nome e cognome ospite non possono essere vuoti"}), 400
        
        db.check_in(room_id, ospite_nome, ospite_cognome)
        
        return jsonify({"message": "Check-in effettuato con successo"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /rooms/<id>/checkout: registra il check-out di un ospite
@app.route("/rooms/<int:room_id>/checkout", methods=["PUT"])
def check_out(room_id):
    try:
        if db is None:
            return jsonify({"error": "Database non disponibile"}), 503
        
        db.check_out(room_id)
        
        return jsonify({"message": "Check-out effettuato con successo"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
#avviamo il server
#debug=True permette il riavvio automatico del server
#quando modifichiamo il codice
#e mostra errori dettagliati in caso di problema.
    app.run(debug=True)