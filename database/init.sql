
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL
);

INSERT INTO tasks (title, status)
VALUES
('Learn Docker', 'Completed'),
('Learn Flask', 'Completed'),
('Learn PostgreSQL', 'Pending'),
('Learn Docker Volumes', 'In Progress');
