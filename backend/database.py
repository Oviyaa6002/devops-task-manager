import psycopg2

def get_connection():
    return psycopg2.connect(
        host="postgres-db",
        database="taskmanager",
        user="devops",
        password="REMOVED_PASSWORD",
        port=5432
    )