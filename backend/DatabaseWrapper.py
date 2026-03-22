import pymysql


class DatabaseWrapper:
    def __init__(self, host, user, password, database, port):
        self.db_config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'port': port,
            'cursorclass': pymysql.cursors.DictCursor,
            'autocommit': True,
        }
        self.create_tables()

    def connect(self):
        return pymysql.connect(**self.db_config)

    def execute_query(self, query, params=()):
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.lastrowid
        finally:
            conn.close()

    def fetch_all(self, query, params=()):
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        finally:
            conn.close()

    def fetch_one(self, query, params=()):
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        finally:
            conn.close()

    def create_tables(self):
        self.execute_query(
            '''
            CREATE TABLE IF NOT EXISTS voti (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studente_username VARCHAR(100) NOT NULL,
                studente_nome VARCHAR(100) NOT NULL,
                materia VARCHAR(100) NOT NULL,
                voto DECIMAL(4,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            '''
        )

    def add_grade(self, studente_username, studente_nome, materia, voto):
        return self.execute_query(
            '''
            INSERT INTO voti (studente_username, studente_nome, materia, voto)
            VALUES (%s, %s, %s, %s)
            ''',
            (studente_username, studente_nome, materia, voto),
        )

    def get_all_grades(self):
        return self.fetch_all(
            '''
            SELECT id, studente_username, studente_nome, materia, voto, created_at
            FROM voti
            ORDER BY studente_nome, materia, created_at DESC
            '''
        )

    def get_grades_for_student(self, studente_username):
        return self.fetch_all(
            '''
            SELECT id, studente_username, studente_nome, materia, voto, created_at
            FROM voti
            WHERE studente_username = %s
            ORDER BY materia, created_at DESC
            ''',
            (studente_username,),
        )
