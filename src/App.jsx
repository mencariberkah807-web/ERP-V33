import { useState } from "react";

import AppShell from "./app/AppShell.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";

const SESSION_KEY = "artkrilik_auth_session";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);

    if (!savedSession) {
      return null;
    }

    return JSON.parse(savedSession);
  });

  function handleLogin(loginUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(loginUser));

    setUser(loginUser);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppShell user={user} onLogout={handleLogout} />;
}
