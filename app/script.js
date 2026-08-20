
/* =========================================================
   TASKFLOW DEVOPS MANAGER
   Frontend Application
========================================================= */

let allTasks = [];
let allTeam = [];

let editingTaskId = null;
let editingTeamId = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
}


function getElement(id) {

    return document.getElementById(id);
}


async function apiRequest(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}


/* =========================================================
   PAGE / NAVIGATION
========================================================= */

function setActiveNav(id) {

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    const item = getElement(id);

    if (item) {
        item.classList.add("active");
    }
}


function hideAllSections() {

    const tasks = document.querySelector(".tasks-container");

    if (tasks) {
        tasks.style.display = "none";
    }

    const dashboard =
        getElement("dashboardSection");

    if (dashboard) {
        dashboard.style.display = "none";
    }

    const myTasks =
        getElement("myTasksSection");

    if (myTasks) {
        myTasks.style.display = "none";
    }

    const allTasksSection =
        getElement("allTasksSection");

    if (allTasksSection) {
        allTasksSection.style.display = "none";
    }

    const team =
        getElement("teamSection");

    if (team) {
        team.style.display = "none";
    }
}


function updatePageTitle(title, subtitle) {

    const titleElement =
        getElement("pageTitle");

    if (titleElement) {
        titleElement.textContent = title;
    }

    const breadcrumb =
        document.querySelector(".breadcrumb");

    if (breadcrumb) {
        breadcrumb.textContent =
            `Workspace / ${title}`;
    }

    const subtitleElement =
        document.querySelector(".page-subtitle");

    if (subtitleElement) {
        subtitleElement.textContent = subtitle;
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function showDashboard(event) {

    if (event) {
        event.preventDefault();
    }

    setActiveNav("dashboardNav");

    hideAllSections();

    updatePageTitle(
        "Dashboard",
        "Overview of your DevOps workspace"
    );

    let section =
        getElement("dashboardSection");

    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "dashboardSection";

        section.className =
            "dashboard-page";

        document
            .querySelector(".main")
            .appendChild(section);
    }

    section.style.display = "block";

    await loadTasks();

    renderDashboard();
}


function renderDashboard() {

    const section =
        getElement("dashboardSection");

    if (!section) {
        return;
    }

    const total =
        allTasks.length;

    const todo =
        allTasks.filter(
            task => task.status === "To Do"
        ).length;

    const progress =
        allTasks.filter(
            task => task.status === "In Progress"
        ).length;

    const completed =
        allTasks.filter(
            task => task.status === "Completed"
        ).length;


    const completion =
        total > 0
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    const recentTasks =
        [...allTasks]
            .sort(
                (a, b) =>
                    Number(b.id) -
                    Number(a.id)
            )
            .slice(0, 5);


    const upcoming =
        getUpcomingTasks();


    section.innerHTML = `

        <div class="dashboard-hero">

            <div>

                <span class="dashboard-label">
                    DEVOPS WORKSPACE
                </span>

                <h2>
                    Project Command Center
                </h2>

                <p>
                    Monitor tasks, deadlines and
                    team activity from one place.
                </p>

            </div>

            <div class="dashboard-rocket">
                🚀
            </div>

        </div>


        <div class="dashboard-stat-grid">

            <div class="dashboard-stat">

                <div class="dashboard-stat-icon">
                    📋
                </div>

                <div>
                    <span>Total Tasks</span>
                    <strong>${total}</strong>
                </div>

            </div>


            <div class="dashboard-stat">

                <div class="dashboard-stat-icon">
                    ⏳
                </div>

                <div>
                    <span>To Do</span>
                    <strong>${todo}</strong>
                </div>

            </div>


            <div class="dashboard-stat">

                <div class="dashboard-stat-icon">
                    ⚙️
                </div>

                <div>
                    <span>In Progress</span>
                    <strong>${progress}</strong>
                </div>

            </div>


            <div class="dashboard-stat">

                <div class="dashboard-stat-icon">
                    ✓
                </div>

                <div>
                    <span>Completed</span>
                    <strong>${completed}</strong>
                </div>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-panel">

                <div class="panel-heading">

                    <div>
                        <h3>Recent Activity</h3>

                        <p>
                            Latest tasks in the workspace
                        </p>
                    </div>

                    <button
                        class="panel-button"
                        onclick="showAllTasks()">
                        View all
                    </button>

                </div>

                <div class="recent-task-list">

                    ${
                        recentTasks.length
                            ? recentTasks.map(
                                renderRecentTask
                            ).join("")
                            : `
                                <div class="empty-state">
                                    No tasks available.
                                </div>
                              `
                    }

                </div>

            </div>


            <div class="dashboard-panel progress-panel">

    <div class="panel-heading">

        <div>
            <h3>Project Progress</h3>
            <p>Overall completion</p>
        </div>

        <strong class="progress-number">
            ${completion}%
        </strong>

    </div>

    <div class="progress-bar-container">

        <div
            class="progress-bar"
            style="width: ${completion}%"
        ></div>

    </div>

    <div class="progress-summary">

        <div>
            <span>Completed</span>
            <strong>${completed}</strong>
        </div>

        <div>
            <span>Remaining</span>
            <strong>${total - completed}</strong>
        </div>

    </div>

</div>


            </div>

        </div>


        <div class="dashboard-panel upcoming-panel">

            <div class="panel-heading">

                <div>

                    <h3>Upcoming Deadlines</h3>

                    <p>
                        Keep track of important due dates
                    </p>

                </div>

                <button
                    class="panel-button"
                    onclick="showAllTasks()">
                    Manage
                </button>

            </div>


            ${
                upcoming.length
                    ? `
                        <div class="upcoming-list">

                            ${
                                upcoming
                                    .slice(0, 5)
                                    .map(
                                        renderUpcomingTask
                                    )
                                    .join("")
                            }

                        </div>
                      `
                    : `
                        <div class="empty-state">
                            🎉 No upcoming deadlines.
                        </div>
                      `
            }

        </div>
    `;
}


function renderRecentTask(task) {

    return `

        <div class="recent-task">

            <div class="recent-task-icon">
                ${
                    task.status === "Completed"
                        ? "✓"
                        : task.status === "In Progress"
                            ? "⚙"
                            : "○"
                }
            </div>

            <div class="recent-task-info">

                <strong>
                    ${escapeHtml(task.title)}
                </strong>

                <span>
                    ${escapeHtml(
                        task.assignee || "Unassigned"
                    )}
                </span>

            </div>

            <span class="status-pill ${getStatusClass(task.status)}">
                ${escapeHtml(task.status)}
            </span>

        </div>
    `;
}


function renderUpcomingTask(task) {

    return `

        <div class="upcoming-task">

            <div class="calendar-icon">
                📅
            </div>

            <div class="upcoming-info">

                <strong>
                    ${escapeHtml(task.title)}
                </strong>

                <span>
                    ${escapeHtml(
                        task.assignee || "Unassigned"
                    )}
                </span>

            </div>

            <div class="due-date">

                <span>Due</span>

                <strong>
                    ${escapeHtml(task.dueDate)}
                </strong>

            </div>

        </div>
    `;
}


/* =========================================================
   MY TASKS
========================================================= */

async function showMyTasks(event) {

    if (event) {
        event.preventDefault();
    }

    setActiveNav("myTasksNav");

    hideAllSections();

    updatePageTitle(
        "My Tasks",
        "Tasks assigned to you"
    );


    let section =
        getElement("myTasksSection");


    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "myTasksSection";

        section.className =
            "my-tasks-page";

        document
            .querySelector(".main")
            .appendChild(section);
    }


    section.style.display = "block";


    await loadTasks();

    renderMyTasks();
}


function renderMyTasks() {

    const section =
        getElement("myTasksSection");

    if (!section) {
        return;
    }


    const myTasks =
        allTasks.filter(
            task =>
                String(task.assignee)
                    .toLowerCase() === "oviya"
        );


    const completed =
        myTasks.filter(
            task => task.status === "Completed"
        ).length;


    const progress =
        myTasks.filter(
            task => task.status === "In Progress"
        ).length;


    const pending =
        myTasks.filter(
            task => task.status === "To Do"
        ).length;


    section.innerHTML = `

        <div class="my-tasks-header">

            <div>

                <span class="section-eyebrow">
                    PERSONAL WORKSPACE
                </span>

                <h2>
                    My Tasks
                </h2>

                <p>
                    Focus on the work assigned to you.
                </p>

            </div>

            <button
                class="new-task-btn"
                onclick="openTaskModal()">
                + New Task
            </button>

        </div>


        <div class="my-task-summary">

            <div class="my-summary-card">

                <span>Assigned</span>

                <strong>
                    ${myTasks.length}
                </strong>

            </div>


            <div class="my-summary-card">

                <span>Pending</span>

                <strong>
                    ${pending}
                </strong>

            </div>


            <div class="my-summary-card">

                <span>In Progress</span>

                <strong>
                    ${progress}
                </strong>

            </div>


            <div class="my-summary-card">

                <span>Completed</span>

                <strong>
                    ${completed}
                </strong>

            </div>

        </div>


        <div class="my-focus-panel">

            <div class="focus-header">

                <div>

                    <h3>
                        Your Work Queue
                    </h3>

                    <p>
                        Tasks requiring your attention
                    </p>

                </div>

                <span>
                    ${myTasks.length} tasks
                </span>

            </div>


            <div class="my-task-list">

                ${
                    myTasks.length
                        ? myTasks
                            .map(
                                renderMyTaskCard
                            )
                            .join("")
                        : `
                            <div class="empty-state">
                                🎉 You have no assigned tasks.
                            </div>
                          `
                }

            </div>

        </div>
    `;
}


function renderMyTaskCard(task) {

    return `

        <div class="my-task-card">

            <div class="my-task-main">

                <div class="task-check ${
                    task.status === "Completed"
                        ? "completed"
                        : ""
                }">

                    ${
                        task.status === "Completed"
                            ? "✓"
                            : ""
                    }

                </div>


                <div>

                    <h3>
                        ${escapeHtml(task.title)}
                    </h3>

                    <p>
                        ${escapeHtml(
                            task.description ||
                            "No description"
                        )}
                    </p>

                    <div class="task-meta">

                        <span class="status-pill ${getStatusClass(task.status)}">
                            ${escapeHtml(task.status)}
                        </span>

                        <span class="priority-pill ${getPriorityClass(task.priority)}">
                            ${escapeHtml(
                                task.priority ||
                                "Medium"
                            )}
                        </span>

                        ${
                            task.dueDate
                                ? `
                                    <span>
                                        📅 ${escapeHtml(
                                            task.dueDate
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </div>


            <div class="my-task-actions">

                <button
                    class="edit-button"
                    onclick="editTask(${task.id})">
                    Edit
                </button>

                <button
                    class="delete-button"
                    onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   ALL TASKS
========================================================= */

async function showAllTasks(event) {

    if (event) {
        event.preventDefault();
    }

    setActiveNav("allTasksNav");

    hideAllSections();

    updatePageTitle(
        "All Tasks",
        "Complete project task management"
    );


    let section =
        getElement("allTasksSection");


    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "allTasksSection";

        section.className =
            "all-tasks-page";

        document
            .querySelector(".main")
            .appendChild(section);
    }


    section.style.display = "block";


    await loadTasks();

    renderAllTasks();
}


function renderAllTasks() {

    const section =
        getElement("allTasksSection");

    if (!section) {
        return;
    }


    section.innerHTML = `

        <div class="all-tasks-header">

            <div>

                <span class="section-eyebrow">
                    PROJECT MANAGEMENT
                </span>

                <h2>
                    All Tasks
                </h2>

                <p>
                    Create, update and manage every
                    task in the project.
                </p>

            </div>

            <button
                class="new-task-btn"
                onclick="openTaskModal()">
                + New Task
            </button>

        </div>


        <div class="task-control-panel">

            <div class="search-box">

                <span>🔍</span>

                <input
                    id="allTaskSearch"
                    type="text"
                    placeholder="Search tasks..."
                    oninput="applyAllTaskFilters()"
                >

            </div>


            <select
                id="allTaskStatus"
                onchange="applyAllTaskFilters()">

                <option value="all">
                    All Status
                </option>

                <option value="To Do">
                    To Do
                </option>

                <option value="In Progress">
                    In Progress
                </option>

                <option value="Completed">
                    Completed
                </option>

            </select>


            <select
                id="allTaskPriority"
                onchange="applyAllTaskFilters()">

                <option value="all">
                    All Priority
                </option>

                <option value="High">
                    High
                </option>

                <option value="Medium">
                    Medium
                </option>

                <option value="Low">
                    Low
                </option>

            </select>

        </div>


        <div
            id="allTaskTable"
            class="all-task-table">
        </div>
    `;


    renderAllTaskTable(allTasks);
}


function applyAllTaskFilters() {

    const search =
        (
            getElement("allTaskSearch")?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const status =
        getElement("allTaskStatus")?.value ||
        "all";


    const priority =
        getElement("allTaskPriority")?.value ||
        "all";


    const filtered =
        allTasks.filter(task => {

            const title =
                String(task.title || "")
                    .toLowerCase();

            const description =
                String(task.description || "")
                    .toLowerCase();

            const matchesSearch =
                title.includes(search) ||
                description.includes(search);


            const matchesStatus =
                status === "all" ||
                task.status === status;


            const matchesPriority =
                priority === "all" ||
                task.priority === priority;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });


    renderAllTaskTable(filtered);
}


function renderAllTaskTable(tasks) {

    const container =
        getElement("allTaskTable");

    if (!container) {
        return;
    }


    if (!tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                No matching tasks found.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="task-table-header">

            <span>Task</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Actions</span>

        </div>


        ${
            tasks
                .map(
                    task => `

                    <div class="task-table-row">

                        <div class="table-task">

                            <strong>
                                ${escapeHtml(task.title)}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    task.description ||
                                    "No description"
                                )}
                            </small>

                        </div>


                        <div>
                            👤
                            ${escapeHtml(
                                task.assignee ||
                                "Unassigned"
                            )}
                        </div>


                        <div>

                            <span class="priority-pill ${getPriorityClass(task.priority)}">
                                ${escapeHtml(
                                    task.priority ||
                                    "Medium"
                                )}
                            </span>

                        </div>


                        <div>

                            <span class="status-pill ${getStatusClass(task.status)}">
                                ${escapeHtml(
                                    task.status
                                )}
                            </span>

                        </div>


                        <div>
                            ${
                                task.dueDate
                                    ? escapeHtml(
                                        task.dueDate
                                    )
                                    : "—"
                            }
                        </div>


                        <div class="table-actions">

                            <button
                                class="edit-button"
                                onclick="editTask(${task.id})">
                                Edit
                            </button>

                            <button
                                class="delete-button"
                                onclick="deleteTask(${task.id})">
                                Delete
                            </button>

                        </div>

                    </div>
                `
                )
                .join("")
        }

    `;
}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    try {

        allTasks =
            await apiRequest("/api/tasks");

        updateDashboardCounters();

    } catch (error) {

        console.error(
            "Task loading error:",
            error
        );

        allTasks = [];

        const errorElement =
            getElement("error");

        if (errorElement) {
            errorElement.textContent =
                "Unable to load tasks.";
        }
    }
}


function updateDashboardCounters() {

    const total =
        allTasks.length;

    const todo =
        allTasks.filter(
            task => task.status === "To Do"
        ).length;

    const progress =
        allTasks.filter(
            task => task.status === "In Progress"
        ).length;

    const completed =
        allTasks.filter(
            task => task.status === "Completed"
        ).length;


    if (getElement("totalTasks")) {
        getElement("totalTasks").textContent =
            total;
    }

    if (getElement("todoTasks")) {
        getElement("todoTasks").textContent =
            todo;
    }

    if (getElement("inProgressTasks")) {
        getElement("inProgressTasks").textContent =
            progress;
    }

    if (getElement("completedTasks")) {
        getElement("completedTasks").textContent =
            completed;
    }
}


/* =========================================================
   CREATE / EDIT TASK MODAL
========================================================= */

function openTaskModal(task = null) {

    editingTaskId =
        task ? task.id : null;


    const modal =
        getElement("taskModal");

    if (!modal) {
        return;
    }


    modal.classList.add("show");


    const heading =
        modal.querySelector("h2");

    if (heading) {

        heading.textContent =
            task
                ? "Edit Task"
                : "Create New Task";
    }


    if (task) {

        getElement("taskTitle").value =
            task.title || "";

        getElement("taskDescription").value =
            task.description || "";

        getElement("taskAssignee").value =
            task.assignee || "Oviya";

        getElement("taskPriority").value =
            task.priority || "Medium";

        getElement("taskDueDate").value =
            task.dueDate || "";

        getElement("taskStatus").value =
            task.status || "To Do";

    } else {

        const form =
            getElement("taskForm");

        if (form) {
            form.reset();
        }

        getElement("taskAssignee").value =
            "Oviya";

        getElement("taskPriority").value =
            "Medium";

        getElement("taskStatus").value =
            "To Do";
    }
}


function closeTaskModal() {

    const modal =
        getElement("taskModal");

    if (modal) {
        modal.classList.remove("show");
    }

    editingTaskId = null;

    const form =
        getElement("taskForm");

    if (form) {
        form.reset();
    }
}


/* =========================================================
   SAVE TASK
========================================================= */

async function saveTask(event) {

    event.preventDefault();


    const title =
        getElement("taskTitle")
            .value
            .trim();


    if (!title) {

        alert(
            "Please enter a task title."
        );

        return;
    }


    const taskData = {

        title,

        description:
            getElement(
                "taskDescription"
            ).value.trim(),

        assignee:
            getElement(
                "taskAssignee"
            ).value,

        priority:
            getElement(
                "taskPriority"
            ).value,

        dueDate:
            getElement(
                "taskDueDate"
            ).value || null,

        status:
            getElement(
                "taskStatus"
            ).value
    };


    try {

        if (editingTaskId) {

            await apiRequest(
                `/api/tasks/${editingTaskId}`,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(
                            taskData
                        )
                }
            );

            alert(
                "Task updated successfully!"
            );

        } else {

            await apiRequest(
                "/api/tasks",
                {
                    method: "POST",
                    body:
                        JSON.stringify(
                            taskData
                        )
                }
            );

            alert(
                "Task created successfully!"
            );
        }


        closeTaskModal();

        await loadTasks();

        refreshCurrentPage();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to save task."
        );
    }
}


/* =========================================================
   EDIT TASK
========================================================= */

async function editTask(id) {

    try {

        const task =
            await apiRequest(
                `/api/tasks/${id}`
            );

        openTaskModal(task);

    } catch (error) {

        alert(
            error.message ||
            "Unable to load task."
        );
    }
}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/tasks/${id}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Task deleted successfully!"
        );


        await loadTasks();

        refreshCurrentPage();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to delete task."
        );
    }
}


/* =========================================================
   TEAM
========================================================= */

async function showTeam(event) {

    if (event) {
        event.preventDefault();
    }

    setActiveNav("teamNav");

    hideAllSections();

    updatePageTitle(
        "Team",
        "Manage your DevOps development team"
    );


    let section =
        getElement("teamSection");


    if (!section) {

        section =
            document.createElement("section");

        section.id =
            "teamSection";

        section.className =
            "team-page";

        document
            .querySelector(".main")
            .appendChild(section);
    }


    section.style.display =
        "block";


    await loadTeam();

    renderTeam();
}


/* =========================================================
   LOAD TEAM
========================================================= */

async function loadTeam() {

    try {

        allTeam =
            await apiRequest("/api/team");

    } catch (error) {

        console.error(
            "Team loading error:",
            error
        );

        allTeam = [];

        alert(
            "Unable to load team."
        );
    }
}


/* =========================================================
   RENDER TEAM
========================================================= */

function renderTeam() {

    const section =
        getElement("teamSection");

    if (!section) {
        return;
    }


    const totalTasks =
        allTeam.reduce(
            (
                total,
                member
            ) =>
                total +
                Number(
                    member.taskCount || 0
                ),
            0
        );


    section.innerHTML = `

        <div class="team-page-header">

            <div>

                <span class="section-eyebrow">
                    PEOPLE & COLLABORATION
                </span>

                <h2>
                    Development Team
                </h2>

                <p>
                    Manage members and monitor
                    workload distribution.
                </p>

            </div>


            <button
                class="new-task-btn"
                onclick="openTeamModal()">
                + Add Member
            </button>

        </div>


        <div class="team-overview">

            <div>

                <span>
                    Team Members
                </span>

                <strong>
                    ${allTeam.length}
                </strong>

            </div>


            <div>

                <span>
                    Assigned Tasks
                </span>

                <strong>
                    ${totalTasks}
                </strong>

            </div>


            <div>

                <span>
                    Active Developers
                </span>

                <strong>
                    ${allTeam.length}
                </strong>

            </div>

        </div>


        <div class="team-grid">

            ${
                allTeam
                    .map(
                        renderTeamMember
                    )
                    .join("")
            }

        </div>
    `;
}


function renderTeamMember(member) {

    const initials =
        String(member.name || "")
            .split(" ")
            .map(
                word =>
                    word.charAt(0)
            )
            .join("")
            .substring(0, 2)
            .toUpperCase();


    return `

        <div class="team-member-card">

            <div class="member-top">

                <div class="member-avatar">
                    ${escapeHtml(initials)}
                </div>

                <span class="online-indicator">
                    ●
                </span>

            </div>


            <div class="member-info">

                <h3>
                    ${escapeHtml(member.name)}
                </h3>

                <p>
                    ${escapeHtml(
                        member.role ||
                        "Developer"
                    )}
                </p>

            </div>


            <div class="member-workload">

                <span>
                    Assigned Tasks
                </span>

                <strong>
                    ${Number(
                        member.taskCount || 0
                    )}
                </strong>

            </div>


            <div class="member-actions">

                <button
                    class="edit-button"
                    onclick="editTeamMember(${member.id})">
                    Edit
                </button>

                <button
                    class="delete-button"
                    onclick="deleteTeamMember(${member.id})">
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   TEAM MODAL
========================================================= */

function openTeamModal(member = null) {

    editingTeamId =
        member ? member.id : null;


    let modal =
        getElement("teamModal");


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "teamModal";

        modal.className =
            "modal";


        modal.innerHTML = `

            <div class="modal-content">

                <div class="modal-header">

                    <div>

                        <h2>
                            Add Team Member
                        </h2>

                        <p>
                            Add a developer to your team
                        </p>

                    </div>

                    <button
                        class="close-btn"
                        onclick="closeTeamModal()">
                        ×
                    </button>

                </div>


                <form
                    id="teamForm"
                    onsubmit="saveTeamMember(event)">

                    <div class="form-group">

                        <label>
                            Name
                        </label>

                        <input
                            id="teamMemberName"
                            type="text"
                            placeholder="e.g. Hareni"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Role
                        </label>

                        <input
                            id="teamMemberRole"
                            type="text"
                            value="Developer"
                            required
                        >

                    </div>


                    <div class="modal-actions">

                        <button
                            type="button"
                            class="cancel-btn"
                            onclick="closeTeamModal()">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="create-btn">
                            Save Member
                        </button>

                    </div>

                </form>

            </div>
        `;


        document.body.appendChild(modal);
    }


    const heading =
        modal.querySelector("h2");

    if (heading) {

        heading.textContent =
            member
                ? "Edit Team Member"
                : "Add Team Member";
    }


    if (member) {

        getElement(
            "teamMemberName"
        ).value =
            member.name || "";

        getElement(
            "teamMemberRole"
        ).value =
            member.role || "Developer";

    } else {

        getElement(
            "teamMemberName"
        ).value = "";

        getElement(
            "teamMemberRole"
        ).value =
            "Developer";
    }


    modal.classList.add("show");
}


function closeTeamModal() {

    const modal =
        getElement("teamModal");

    if (modal) {
        modal.classList.remove("show");
    }

    editingTeamId = null;
}


/* =========================================================
   SAVE TEAM MEMBER
========================================================= */

async function saveTeamMember(event) {

    event.preventDefault();


    const name =
        getElement(
            "teamMemberName"
        )
            .value
            .trim();


    const role =
        getElement(
            "teamMemberRole"
        )
            .value
            .trim();


    if (!name) {

        alert(
            "Please enter a name."
        );

        return;
    }


    try {

        const data = {
            name,
            role:
                role ||
                "Developer"
        };


        if (editingTeamId) {

            await apiRequest(
                `/api/team/${editingTeamId}`,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(data)
                }
            );

            alert(
                "Team member updated successfully!"
            );

        } else {

            await apiRequest(
                "/api/team",
                {
                    method: "POST",
                    body:
                        JSON.stringify(data)
                }
            );

            alert(
                "Team member added successfully!"
            );
        }


        closeTeamModal();

        await loadTeam();

        renderTeam();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to save team member."
        );
    }
}


/* =========================================================
   EDIT TEAM MEMBER
========================================================= */

async function editTeamMember(id) {

    try {

        const member =
            await apiRequest(
                `/api/team/${id}`
            );

        openTeamModal(member);

    } catch (error) {

        alert(
            error.message ||
            "Unable to load team member."
        );
    }
}


/* =========================================================
   DELETE TEAM MEMBER
========================================================= */

async function deleteTeamMember(id) {

    const confirmed =
        confirm(
            "Delete this team member?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/team/${id}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Team member deleted successfully!"
        );


        await loadTeam();

        renderTeam();

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to delete team member."
        );
    }
}


/* =========================================================
   REMINDER / NOTIFICATION
========================================================= */

async function showReminders() {

    await loadTasks();


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    const target =
        formatDate(tomorrow);


    const upcoming =
        allTasks.filter(
            task =>
                task.dueDate === target &&
                task.status !== "Completed"
        );


    if (!upcoming.length) {

        alert(
            "🔔 No incomplete tasks are due tomorrow."
        );

        return;
    }


    let message =
        "🔔 TASKS DUE TOMORROW\n\n";


    upcoming.forEach(
        task => {

            message +=
                `• ${task.title}\n`;

            message +=
                `  Assigned to: ${task.assignee}\n`;

            message +=
                `  Priority: ${task.priority}\n\n`;
        }
    );


    alert(message);
}


function formatDate(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function getUpcomingTasks() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    return allTasks
        .filter(task => {

            if (!task.dueDate) {
                return false;
            }

            const date =
                new Date(
                    `${task.dueDate}T00:00:00`
                );


            return (
                date >= today &&
                task.status !== "Completed"
            );
        })
        .sort(
            (a, b) =>
                new Date(
                    a.dueDate
                ) -
                new Date(
                    b.dueDate
                )
        );
}


/* =========================================================
   STATUS / PRIORITY CLASSES
========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "Completed":
            return "status-completed";

        case "In Progress":
            return "status-progress";

        default:
            return "status-todo";
    }
}


function getPriorityClass(priority) {

    switch (priority) {

        case "High":
            return "priority-high";

        case "Low":
            return "priority-low";

        default:
            return "priority-medium";
    }
}


/* =========================================================
   REFRESH CURRENT PAGE
========================================================= */

function refreshCurrentPage() {

    const dashboard =
        getElement(
            "dashboardSection"
        );


    const myTasks =
        getElement(
            "myTasksSection"
        );


    const allTasksSection =
        getElement(
            "allTasksSection"
        );


    const team =
        getElement(
            "teamSection"
        );


    if (
        dashboard &&
        dashboard.style.display !== "none"
    ) {

        renderDashboard();

        return;
    }


    if (
        myTasks &&
        myTasks.style.display !== "none"
    ) {

        renderMyTasks();

        return;
    }


    if (
        allTasksSection &&
        allTasksSection.style.display !== "none"
    ) {

        renderAllTasks();

        return;
    }


    if (
        team &&
        team.style.display !== "none"
    ) {

        renderTeam();
    }
}


/* =========================================================
   NAVIGATION SETUP
========================================================= */

function setupNavigation() {

    const dashboard =
        getElement("dashboardNav");

    const myTasks =
        getElement("myTasksNav");

    const allTasksNav =
        getElement("allTasksNav");

    const team =
        getElement("teamNav");


    if (dashboard) {

        dashboard.onclick =
            showDashboard;
    }


    if (myTasks) {

        myTasks.onclick =
            showMyTasks;
    }


    if (allTasksNav) {

        allTasksNav.onclick =
            showAllTasks;
    }


    if (team) {

        team.onclick =
            showTeam;
    }
}


/* =========================================================
   FORM SETUP
========================================================= */

function setupTaskForm() {

    const form =
        getElement("taskForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        saveTask
    );
}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const taskModal =
            getElement("taskModal");


        if (
            taskModal &&
            event.target === taskModal
        ) {

            closeTaskModal();
        }


        const teamModal =
            getElement("teamModal");


        if (
            teamModal &&
            event.target === teamModal
        ) {

            closeTeamModal();
        }
    }
);


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeTaskModal();

            closeTeamModal();
        }
    }
);


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

async function initializeApp() {

    setupNavigation();

    setupTaskForm();

    await loadTasks();

    await showDashboard();
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
/* =========================================================
   TASKFLOW — NOTIFICATION & PROFILE UX
========================================================= */

function showToast(message) {

    const oldToast =
        document.querySelector(".tf-toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "tf-toast";

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3600);
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function toggleNotifications(event) {

    if (event) {
        event.stopPropagation();
    }

    const existing =
        document.querySelector(
            ".tf-notification-panel"
        );

    if (existing) {
        existing.remove();
        return;
    }

    closeProfileMenu();

    const panel =
        document.createElement("div");

    panel.className =
        "tf-notification-panel";

    const upcoming =
        typeof allTasks !== "undefined"
            ? getUpcomingTasks()
            : [];

    const inProgress =
        typeof allTasks !== "undefined"
            ? allTasks.filter(
                task =>
                    task.status ===
                    "In Progress"
            )
            : [];

    panel.innerHTML = `

        <div class="tf-notification-header">

            <strong>
                Notifications
            </strong>

            <button
                type="button"
                onclick="
                    document
                        .querySelector('.tf-notification-panel')
                        ?.remove()
                "
                style="
                    border:none;
                    background:none;
                    cursor:pointer;
                    font-size:18px;
                ">
                ×
            </button>

        </div>


        ${
            upcoming.length
                ? upcoming
                    .slice(0, 3)
                    .map(task => `

                        <div
                            class="tf-notification-item"
                            onclick="
                                document
                                    .querySelector(
                                        '.tf-notification-panel'
                                    )
                                    ?.remove();

                                showAllTasks();
                            ">

                            <div
                                class="tf-notification-icon">
                                📅
                            </div>

                            <div>

                                <strong>
                                    Upcoming deadline
                                </strong>

                                <div>
                                    ${escapeHtml(
                                        task.title
                                    )}
                                </div>

                                <small>
                                    Due
                                    ${escapeHtml(
                                        task.dueDate ||
                                        "soon"
                                    )}
                                </small>

                            </div>

                        </div>

                    `)
                    .join("")
                : `
                    <div
                        class="tf-notification-item">

                        <div
                            class="tf-notification-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                All caught up
                            </strong>

                            <div>
                                No urgent deadlines.
                            </div>

                        </div>

                    </div>
                `
        }


        ${
            inProgress.length
                ? `
                    <div
                        class="tf-notification-item">

                        <div
                            class="tf-notification-icon">
                            ⚙
                        </div>

                        <div>

                            <strong>
                                Work in progress
                            </strong>

                            <div>
                                ${inProgress.length}
                                task${
                                    inProgress.length === 1
                                        ? ""
                                        : "s"
                                }
                                currently active.
                            </div>

                        </div>

                    </div>
                `
                : ""
        }

    `;

    document.body.appendChild(panel);
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

let notificationsRead = false;

function toggleNotifications() {

    const panel = document.getElementById("notificationPanel");

    if (!panel) return;

    const isOpen = panel.style.display === "block";

    panel.style.display = isOpen ? "none" : "block";

    if (!isOpen) {
        renderNotifications();
    }
}


function renderNotifications() {

    const list =
        document.getElementById("notificationList");

    const badge =
        document.getElementById("notificationBadge");

    if (!list) return;

    const notifications = [];

    const today =
        new Date();

    allTasks.forEach(task => {

        if (!task.dueDate) return;

        const due =
            new Date(task.dueDate);

        const diff =
            Math.ceil(
                (due - today) /
                (1000 * 60 * 60 * 24)
            );

        if (
            diff >= 0 &&
            diff <= 3 &&
            task.status !== "Completed"
        ) {

            notifications.push({
                type: "deadline",
                title: "Upcoming deadline",
                text: `${task.title} is due ${
                    diff === 0
                        ? "today"
                        : `in ${diff} day${diff === 1 ? "" : "s"}`
                }`
            });
        }
    });


    const activeTasks =
        allTasks.filter(
            task =>
                task.status === "In Progress"
        ).length;


    if (activeTasks > 0) {

        notifications.push({
            type: "activity",
            title: "Work in progress",
            text: `${activeTasks} task${
                activeTasks === 1 ? "" : "s"
            } currently in progress`
        });
    }


    if (!notifications.length) {

        list.innerHTML = `
            <div class="notification-empty-modern">

                <div class="notification-empty-icon">
                    ✓
                </div>

                <strong>
                    You're all caught up
                </strong>

                <span>
                    No urgent task notifications.
                </span>

            </div>
        `;

        if (badge) {
            badge.style.display = "none";
        }

        return;
    }


    list.innerHTML =
        notifications.map(notification => `

            <div class="notification-item">

                <div class="
                    notification-item-icon
                    ${notification.type}
                ">
                    ${
                        notification.type === "deadline"
                            ? "◷"
                            : "↗"
                    }
                </div>

                <div class="notification-item-content">

                    <strong>
                        ${escapeHtml(notification.title)}
                    </strong>

                    <span>
                        ${escapeHtml(notification.text)}
                    </span>

                </div>

            </div>

        `).join("");


    if (badge && !notificationsRead) {

        badge.textContent =
            notifications.length;

        badge.style.display =
            "flex";
    }
}


function markNotificationsRead() {

    notificationsRead = true;

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    if (badge) {
        badge.style.display = "none";
    }

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (panel) {
        panel.style.display = "none";
    }
}


/* =========================================================
   PROFILE MENU
========================================================= */

function toggleProfileMenu() {

    const menu = document.getElementById("profileMenu");

    if (!menu) {
        console.error("Profile menu not found");
        return;
    }

    const isVisible = menu.classList.contains("show");

    menu.classList.toggle("show", !isVisible);
}


function showProfileInfo() {

    const menu = document.getElementById("profileMenu");

    if (menu) {
        menu.classList.remove("show");
    }

    alert(
        "Oviya\n\nRole: Developer\nWorkspace: TaskFlow DevOps Manager"
    );
}


function showWorkspaceInfo() {

    const menu = document.getElementById("profileMenu");

    if (menu) {
        menu.classList.remove("show");
    }

    alert(
        "Workspace\n\nTaskFlow DevOps Manager\nRole: Developer"
    );
}


function showSystemInfo() {

    const menu = document.getElementById("profileMenu");

    if (menu) {
        menu.classList.remove("show");
    }

    alert(
        "System Status\n\nFrontend: Online\nBackend: Connected\nWorkspace: Active"
    );
}


function closeProfileMenu() {

    const menu = document.getElementById("profileMenu");

    if (menu) {
        menu.classList.remove("show");
    }
}

/* =========================================================
   CLOSE FLOATING MENUS
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const notificationButton =
            document.getElementById(
                "notificationButton"
            );

        const notificationPanel =
            document.getElementById(
                "notificationPanel"
            );

        if (
            notificationPanel &&
            notificationButton &&
            !notificationPanel.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {

            notificationPanel.style.display =
                "none";
        }


        const profile =
            document.querySelector(".profile");

        const profileMenu =
            document.getElementById(
                "profileMenu"
            );

        if (
            profile &&
            profileMenu &&
            !profile.contains(event.target) &&
            !profileMenu.contains(event.target)
        ) {

            profileMenu.classList.remove(
                "show"
            );
        }
    }
);
