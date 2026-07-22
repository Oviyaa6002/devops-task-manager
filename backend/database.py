import psycopg2

def get_connection():
    return psycopg2.connect(
        host="postgres-db",
        database="taskmanager",
        user="devops",
        password="devops123",
        port=5432
    )