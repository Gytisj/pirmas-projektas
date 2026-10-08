import { useState } from "react";
import "./TaskList.css";

function TaskList({
  tasks = [],
  loading = false,
  error = "",
  updateError = "",
  onStatusChange,
  onDeadlineChange,
  onTitleChange,
  onDelete,
}) {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  function startEditing(task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditTitle("");
  }

  function saveTitle(task) {
    const title = editTitle.trim();

    if (title && title !== task.title) {
      onTitleChange?.(task.id, title);
    }

    cancelEditing();
  }

  function handleDelete(task) {
    if (window.confirm(`Ištrinti užduotį „${task.title}“?`)) {
      onDelete?.(task.id);
    }
  }

  if (loading) {
    return (
      <section className="task-card">
        <p className="task-state">Kraunamos užduotys...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="task-card">
        <p className="task-state" role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="task-card">
        <p className="task-state">Užduočių kol kas nėra.</p>
      </section>
    );
  }

  return (
    <section className="task-card">
      <header className="task-card__header">
        <h2>Užduotys</h2>
        <p>Artimiausi darbai ir jų būsena</p>
      </header>

      {updateError && (
        <p className="task-update-error" role="alert">
          {updateError}
        </p>
      )}

      <div className="task-list">
        {tasks.map((task) => {
          const isEditing = editingTaskId === task.id;

          return (
            <article className="task-item" key={task.id}>
              <div className="task-item__top">
                {isEditing ? (
                  <form
                    className="task-title-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveTitle(task);
                    }}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") cancelEditing();
                      }}
                      aria-label="Užduoties pavadinimas"
                      autoFocus
                      required
                    />
                  </form>
                ) : (
                  <h3>{task.title}</h3>
                )}

                <label className="task-status-field">
                  <span className="visually-hidden">Užduoties statusas</span>
                  <select
                    className={`task-status task-status--${task.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                    value={task.status}
                    onChange={(event) =>
                      onStatusChange?.(task.id, event.target.value)
                    }
                    aria-label={`Keisti užduoties „${task.title}“ statusą`}
                  >
                    <option value="Nepradėta">Nepradėta</option>
                    <option value="Vykdoma">Vykdoma</option>
                    <option value="Atlikta">Atlikta</option>
                  </select>
                </label>
              </div>

              <label className="task-deadline">
                <span>Terminas:</span>
                <input
                  type="date"
                  value={task.deadline}
                  onChange={(event) =>
                    onDeadlineChange?.(task.id, event.target.value)
                  }
                  aria-label={`Keisti užduoties „${task.title}“ terminą`}
                />
              </label>

              <div className="task-item__actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="task-action task-action--primary"
                      onClick={() => saveTitle(task)}
                    >
                      Išsaugoti
                    </button>
                    <button
                      type="button"
                      className="task-action"
                      onClick={cancelEditing}
                    >
                      Atšaukti
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="task-action"
                      onClick={() => startEditing(task)}
                      aria-label={`Redaguoti užduotį „${task.title}“`}
                    >
                      Redaguoti
                    </button>
                    <button
                      type="button"
                      className="task-action task-action--danger"
                      onClick={() => handleDelete(task)}
                      aria-label={`Ištrinti užduotį „${task.title}“`}
                    >
                      Ištrinti
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TaskList;
