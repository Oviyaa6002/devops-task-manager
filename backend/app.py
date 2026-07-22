from flask import Flask, jsonify
from database import get_connection

app = Flask(__name__)

@app.route("/")
def home():
    return {
        "message": "Welcome to DevOps Task Manager!",
        "status": "Running"
    }

@app.route("/tasks")
def get_tasks():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, title, status FROM tasks;")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    tasks = []

    for row in rows:
        tasks.append({
            "id": row[0],
            "title": row[1],
            "status": row[2]
        })

    return jsonify(tasks)

@app.route("/health")
def health():
    return {"health": "OK"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)