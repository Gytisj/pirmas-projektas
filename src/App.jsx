import { useEffect, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import AuthForm from "./AuthForm";
import Profile from "./Profile";
import "./App.css";
import { createTask, deleteTask, getTasks, updateTask } from "./taskApi";

const USER_STORAGE_KEY = "flowlyUser";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
  } catch {
    return null;
  }
}

function App() {
  const [activePage, setActivePage] = useState("home");
  const [currentUser, setCurrentUser] = useState(getSavedUser);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(Boolean(currentUser));
  const [tasksError, setTasksError] = useState("");
  const [taskUpdateError, setTaskUpdateError] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    let ignore = false;

    getTasks()
      .then((response) => {
        if (ignore) return;
        setTasks(
          response.data.filter(
            (task) => task.username === currentUser.username,
          ),
        );
      })
      .catch(() => {
        if (!ignore) setTasksError("Nepavyko užkrauti užduočių.");
      })
      .finally(() => {
        if (!ignore) setTasksLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentUser]);

  function handleLogin(user) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Jei localStorage neprieinamas, vartotojas liks prisijungęs iki perkrovimo.
    }

    setTasks([]);
    setTasksError("");
    setTaskUpdateError("");
    setTasksLoading(true);
    setCurrentUser(user);
  }

  function handleLogout() {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Nieko nedarome – vartotojas vis tiek atjungiamas.
    }

    setCurrentUser(null);
    setTasks([]);
    setActivePage("home");
  }

  async function handleAddTask(newTask) {
    const savedTask = await createTask({
      ...newTask,
      username: currentUser.username,
    });
    setTasks((currentTasks) => [savedTask, ...currentTasks]);
  }

  async function handleTaskUpdate(taskId, changes) {
    const previousTask = tasks.find((task) => task.id === taskId);
    const updatedTask = { ...previousTask, ...changes };

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
    );
    setTaskUpdateError("");

    try {
      await updateTask(taskId, {
        title: updatedTask.title,
        status: updatedTask.status,
        deadline: updatedTask.deadline,
        username: currentUser.username,
      });
    } catch {
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? previousTask : task)),
      );
      setTaskUpdateError("Nepavyko išsaugoti pakeitimo.");
    }
  }

  function handleTaskStatusChange(taskId, status) {
    handleTaskUpdate(taskId, { status });
  }

  function handleTaskDeadlineChange(taskId, deadline) {
    handleTaskUpdate(taskId, { deadline });
  }

  function handleTaskTitleChange(taskId, title) {
    handleTaskUpdate(taskId, { title });
  }

  async function handleTaskDelete(taskId) {
    setTaskUpdateError("");

    try {
      await deleteTask(taskId);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch {
      setTaskUpdateError("Nepavyko ištrinti užduoties.");
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedTaskCount = tasks.filter(
    (task) => task.status === "Atlikta",
  ).length;
  const overdueTaskCount = tasks.filter((task) => {
    if (task.status === "Atlikta" || !task.deadline) return false;

    const deadline = new Date(`${task.deadline}T00:00:00`);
    return deadline < today;
  }).length;

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      {activePage === "home" && (
        <>
          {currentUser && (
            <header className="welcome-message">
              <h1>Sveiki sugrįžę!</h1>
              <p>Prisijungėte kaip {currentUser.username}.</p>
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Atsijungti
              </button>
            </header>
          )}

          <main className="login-page">
            {!currentUser && <AuthForm onLogin={handleLogin} />}

            {currentUser && (
              <>
                <section
                  className="dashboard-summary"
                  aria-label="Užduočių suvestinė"
                >
                  <p>
                    <strong>{tasks.length} užduotys</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{completedTaskCount} atliktos</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{overdueTaskCount} vėluoja</strong>
                  </p>
                </section>

                <TaskList
                  tasks={tasks}
                  loading={tasksLoading}
                  error={tasksError}
                  updateError={taskUpdateError}
                  onStatusChange={handleTaskStatusChange}
                  onDeadlineChange={handleTaskDeadlineChange}
                  onTitleChange={handleTaskTitleChange}
                  onDelete={handleTaskDelete}
                />

                <AddTaskForm onAddTask={handleAddTask} />

                <ProgressBar initialProgress={50} />
              </>
            )}
          </main>
        </>
      )}

      {activePage === "profile" && (
        <Profile
          user={currentUser ?? {}}
          tasks={tasks}
          onLogout={currentUser ? handleLogout : undefined}
        />
      )}
    </>
  );
}

export default App;
