import pymysql

class DatabaseWrapper:

    #costruttore, contiene i dati di connessione al db
    def __init__(self, host, user, password, database, port):
        self.db_config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'port': port, 
            'cursorclass': pymysql.cursors.DictCursor
        }
        self.create_table()  #chiama il metodo sotto

    #apre la connessione ogni volta che serve
    def connect(self):
        return pymysql.connect(**self.db_config)

    #operazioni INSERT, DELETE (tutte le op di DML e DDL)
    def execute_query(self, query, params=()):
        conn = self.connect()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            conn.commit()
        conn.close()

    #SELECT (ritorna lista di dizionari)
    def fetch_query(self, query, params=()):
        conn = self.connect()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
        conn.close()
        return result
    
    #da qui in poi dipende dal progetto
    #prima uguale x ogni progetto

    #qui creiamo la/le tabella/e
    def create_table(self):
        self.execute_query('''
            CREATE TABLE IF NOT EXISTS Camere (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero VARCHAR(10) NOT NULL UNIQUE,
                tipologia VARCHAR(50) NOT NULL,
                prezzo DECIMAL(10, 2) NOT NULL,
                occupata BOOLEAN DEFAULT FALSE,
                ospite_nome VARCHAR(100),
                ospite_cognome VARCHAR(100)
            )
        ''')

    #SELECT * camere
    def get_camere(self):
        return self.fetch_query("SELECT * FROM Camere ORDER BY numero")

    #INSERT camera
    def aggiungi_camera(self, numero, tipologia, prezzo):
        self.execute_query(
            "INSERT INTO Camere (numero, tipologia, prezzo) VALUES (%s, %s, %s)",
            (numero, tipologia, prezzo)
            #%s fa da placeholder: "le variabili che passo come parametri prendono i valori di %s"
        )