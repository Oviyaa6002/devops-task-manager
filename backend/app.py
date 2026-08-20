from flask import Flask, jsonify, request
from database import get_connection

app = Flask(__name__)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to DevOps Task Manager!",
        "status": "Running"
    })


# =========================================================
# GET ALL TASKS
# =========================================================

@app.route("/tasks", methods=["GET"])
def get_tasks():

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                id,
                title,
                status,
                description,
                assignee,
                priority,
                due_date
            FROM tasks
            ORDER BY id DESC;
        """)

        rows = cur.fetchall()

        tasks = []

        for row in rows:
            tasks.append({
                "id": row[0],
                "title": row[1],
                "status": row[2],
                "description": row[3],
                "assignee": row[4],
                "priority": row[5],
                "dueDate": row[6].isoformat() if row[6] else None
            })

        return jsonify(tasks)

    finally:
        cur.close()
        conn.close()


# =========================================================
# GET SINGLE TASK
# =========================================================

@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                id,
                title,
                status,
                description,
                assignee,
                priority,
                due_date
            FROM tasks
            WHERE id = %s;
        """, (task_id,))

        row = cur.fetchone()

        if not row:
            return jsonify({
                "error": "Task not found"
            }), 404

        task = {
            "id": row[0],
            "title": row[1],
            "status": row[2],
            "description": row[3],
            "assignee": row[4],
            "priority": row[5],
            "dueDate": row[6].isoformat() if row[6] else None
        }

        return jsonify(task)

    finally:
        cur.close()
        conn.close()


# =========================================================
# CREATE TASK
# =========================================================

@app.route("/tasks", methods=["POST"])
def create_task():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "error": "Task title is required"
        }), 400

    description = data.get("description", "")
    assignee = data.get("assignee", "Oviya")
    priority = data.get("priority", "Medium")
    due_date = data.get("dueDate") or None
    status = data.get("status", "To Do")

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO tasks
            (
                title,
                description,
                assignee,
                priority,
                due_date,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            title,
            description,
            assignee,
            priority,
            due_date,
            status
        ))

        task_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Task created successfully",
            "id": task_id
        }), 201

    except Exception as error:

        conn.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# UPDATE TASK
# =========================================================

@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "error": "Task title is required"
        }), 400

    description = data.get("description", "")
    assignee = data.get("assignee", "Oviya")
    priority = data.get("priority", "Medium")
    due_date = data.get("dueDate") or None
    status = data.get("status", "To Do")

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            UPDATE tasks
            SET
                title = %s,
                description = %s,
                assignee = %s,
                priority = %s,
                due_date = %s,
                status = %s
            WHERE id = %s
            RETURNING id;
        """, (
            title,
            description,
            assignee,
            priority,
            due_date,
            status,
            task_id
        ))

        updated = cur.fetchone()

        if not updated:

            conn.rollback()

            return jsonify({
                "error": "Task not found"
            }), 404

        conn.commit()

        return jsonify({
            "message": "Task updated successfully",
            "id": task_id
        })

    except Exception as error:

        conn.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# DELETE TASK
# =========================================================

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            DELETE FROM tasks
            WHERE id = %s
            RETURNING id;
        """, (task_id,))

        deleted = cur.fetchone()

        if not deleted:

            conn.rollback()

            return jsonify({
                "error": "Task not found"
            }), 404

        conn.commit()

        return jsonify({
            "message": "Task deleted successfully",
            "id": task_id
        })

    except Exception as error:

        conn.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# GET TEAM MEMBERS
# =========================================================

@app.route("/team", methods=["GET"])
def get_team():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                tm.id,
                tm.name,
                tm.role,
                COUNT(t.id) AS task_count
            FROM team_members tm
            LEFT JOIN tasks t
                ON t.assignee = tm.name
            GROUP BY
                tm.id,
                tm.name,
                tm.role
            ORDER BY tm.id;
        """)

        rows = cur.fetchall()

        members = []

        for row in rows:

            members.append({
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "taskCount": row[3]
            })

        return jsonify(members)

    finally:
        cur.close()
        conn.close()


# =========================================================
# GET SINGLE TEAM MEMBER
# =========================================================

@app.route("/team/<int:member_id>", methods=["GET"])
def get_team_member(member_id):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                id,
                name,
                role
            FROM team_members
            WHERE id = %s;
        """, (member_id,))

        row = cur.fetchone()

        if not row:

            return jsonify({
                "error": "Team member not found"
            }), 404

        return jsonify({
            "id": row[0],
            "name": row[1],
            "role": row[2]
        })

    finally:
        cur.close()
        conn.close()


# =========================================================
# CREATE TEAM MEMBER
# =========================================================

@app.route("/team", methods=["POST"])
def create_team_member():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    role = data.get("role", "Developer").strip()

    if not name:

        return jsonify({
            "error": "Name is required"
        }), 400

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            INSERT INTO team_members
            (name, role)
            VALUES (%s, %s)
            RETURNING id;
        """, (
            name,
            role
        ))

        member_id = cur.fetchone()[0]

        conn.commit()

        return jsonify({
            "message": "Team member created successfully",
            "id": member_id
        }), 201

    except Exception as error:

        conn.rollback()

        if "duplicate key" in str(error).lower():

            return jsonify({
                "error": "A team member with this name already exists"
            }), 409

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# UPDATE TEAM MEMBER
# =========================================================

@app.route("/team/<int:member_id>", methods=["PUT"])
def update_team_member(member_id):

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Request body is required"
        }), 400

    new_name = data.get("name", "").strip()
    role = data.get("role", "Developer").strip()

    if not new_name:

        return jsonify({
            "error": "Name is required"
        }), 400

    conn = get_connection()
    cur = conn.cursor()

    try:

        # Get existing name first
        cur.execute("""
            SELECT name
            FROM team_members
            WHERE id = %s;
        """, (member_id,))

        existing = cur.fetchone()

        if not existing:

            return jsonify({
                "error": "Team member not found"
            }), 404

        old_name = existing[0]

        # Update team member
        cur.execute("""
            UPDATE team_members
            SET
                name = %s,
                role = %s
            WHERE id = %s
            RETURNING id;
        """, (
            new_name,
            role,
            member_id
        ))

        updated = cur.fetchone()

        # If the name changed, update assigned tasks
        if old_name != new_name:

            cur.execute("""
                UPDATE tasks
                SET assignee = %s
                WHERE assignee = %s;
            """, (
                new_name,
                old_name
            ))

        conn.commit()

        return jsonify({
            "message": "Team member updated successfully",
            "id": member_id
        })

    except Exception as error:

        conn.rollback()

        if "duplicate key" in str(error).lower():

            return jsonify({
                "error": "A team member with this name already exists"
            }), 409

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# DELETE TEAM MEMBER
# =========================================================

@app.route("/team/<int:member_id>", methods=["DELETE"])
def delete_team_member(member_id):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # Find member
        cur.execute("""
            SELECT name
            FROM team_members
            WHERE id = %s;
        """, (member_id,))

        member = cur.fetchone()

        if not member:

            return jsonify({
                "error": "Team member not found"
            }), 404

        member_name = member[0]

        # Check assigned tasks
        cur.execute("""
            SELECT COUNT(*)
            FROM tasks
            WHERE assignee = %s;
        """, (member_name,))

        task_count = cur.fetchone()[0]

        if task_count > 0:

            return jsonify({
                "error": (
                    f"Cannot delete {member_name}. "
                    f"{task_count} task(s) are still assigned to this member."
                )
            }), 409

        # Delete member
        cur.execute("""
            DELETE FROM team_members
            WHERE id = %s;
        """, (member_id,))

        conn.commit()

        return jsonify({
            "message": "Team member deleted successfully",
            "id": member_id
        })

    except Exception as error:

        conn.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/health")
def health():

    return jsonify({
        "health": "OK"
    })


# =========================================================
# APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000
    )
