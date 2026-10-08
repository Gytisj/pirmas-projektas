import { useEffect, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import "./App.css";
import { createTask, deleteTask, getTasks, updateTask } from "./taskApi";

function App() {
  const user = {
    name: "Jonas Jonaitis",
    email: "jonas@flowly.lt",
  };

  const [activePage, setActivePage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [taskUpdateError, setTaskUpdateError] = useState("");

  useEffect(() => {
    getTasks()
      .then((response) => setTasks(response.data))
      .catch(() => setTasksError("Nepavyko užkrauti užduočių."))
      .finally(() => setTasksLoading(false));
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (email === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  async function handleAddTask(newTask) {
    const savedTask = await createTask(newTask);
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
          {isLoggedIn && (
            <header className="welcome-message">
              <h1>Sveiki sugrįžę!</h1>
              <p>Prisijungėte kaip admin.</p>
            </header>
          )}

          <main className="login-page">
            {!isLoggedIn && (
              <div className="login-card">
                <>
                  <header className="login-card__header">
                    <h1>Prisijungti</h1>
                    <p>Įveskite savo duomenis, kad tęstumėte</p>
                  </header>

                  <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-field">
                      <span>Vartotojo vardas</span>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="admin"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>

                    <label className="login-field">
                      <span>Slaptažodis</span>
                      <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </label>

                    <button type="submit" className="login-submit">
                      Prisijungti
                    </button>

                    {loginError && (
                      <p className="login-error" role="alert">
                        {loginError}
                      </p>
                    )}
                  </form>
                </>
              </div>
            )}

            {isLoggedIn && (
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

      {activePage === "profile" && <Profile user={user} tasks={tasks} />}
    </>
  );
}

export default App;
