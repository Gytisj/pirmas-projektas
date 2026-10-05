import { useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Sukurti prisijungimo formą",
      status: "Atlikta",
      deadline: "2026-10-01",
    },
    {
      id: 2,
      title: "Sukurti užduočių sąrašą",
      status: "Vykdoma",
      deadline: "2026-10-05",
    },
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    if (email === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
  }

  function handleAddTask(newTask) {
    setTasks((currentTasks) => [...currentTasks, newTask]);
  }

  function handleTaskStatusChange(taskId, status) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );
  }

  function handleTaskDeadlineChange(taskId, deadline) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, deadline } : task,
      ),
    );
  }

  return (
    <>
      <Navbar />

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
            <TaskList
              tasks={tasks}
              loading={false}
              onStatusChange={handleTaskStatusChange}
              onDeadlineChange={handleTaskDeadlineChange}
            />

            <AddTaskForm onAddTask={handleAddTask} />

            <ProgressBar initialProgress={50} />
          </>
        )}
      </main>
    </>
  );
}

export default App;
