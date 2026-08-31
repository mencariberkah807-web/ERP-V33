import { useState } from "react";

import "./auth.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!username || !password) {
      setError("Username dan password wajib diisi.");

      return;
    }

    if (username === "admin" && password === "admin") {
      onLogin({
        username: "admin",
        name: "Administrator",
      });

      return;
    }

    setError("Username atau password salah.");
  }

  return (
    <div className="login-page">
      <div className="ui-card login-card">
        <div className="login-brand">ARTKRILIK ERP</div>

        <h1>Login</h1>

        <p className="login-description">Masuk untuk mengakses sistem ERP</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Username</label>

          <input
            className="ui-input"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
          />

          <label>Password</label>

          <input
            className="ui-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />

          {error && <div className="login-error">{error}</div>}

          <button className="ui-button-primary" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
