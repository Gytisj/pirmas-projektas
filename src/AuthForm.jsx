import { useState } from "react";
import { loginUser, registerUser } from "./authApi";
import "./AuthForm.css";

function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (isRegister && password !== confirmPassword) {
      setError("Slaptažodžiai nesutampa.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = isRegister
        ? await registerUser(trimmedUsername, password)
        : await loginUser(trimmedUsername, password);

      onLogin({ id: user.id, username: user.username });
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-card">
      <header className="login-card__header">
        <h1>{isRegister ? "Registracija" : "Prisijungti"}</h1>
        <p>
          {isRegister
            ? "Susikurkite paskyrą, kad galėtumėte tęsti"
            : "Įveskite savo duomenis, kad tęstumėte"}
        </p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span>Vartotojo vardas</span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="vardas"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="login-field">
          <span>Slaptažodis</span>
          <input
            type="password"
            name="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {isRegister && (
          <label className="login-field">
            <span>Pakartokite slaptažodį</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
        )}

        <button type="submit" className="login-submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Palaukite..."
            : isRegister
              ? "Registruotis"
              : "Prisijungti"}
        </button>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-switch">
        {isRegister ? "Jau turite paskyrą?" : "Neturite paskyros?"}{" "}
        <button type="button" className="auth-switch__button" onClick={switchMode}>
          {isRegister ? "Prisijungti" : "Registruotis"}
        </button>
      </p>
    </div>
  );
}

export default AuthForm;
