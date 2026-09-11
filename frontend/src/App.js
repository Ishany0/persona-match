import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Questionnaire from "./pages/Questionnaire";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";

import "./App.css";

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  // pick up an existing session from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem("pm_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="app-shell">
      <Navbar user={user} setUser={setUser} />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />

          <Route
            path="/profile"
            element={
              <RequireAuth user={user}>
                <Profile user={user} setUser={setUser} />
              </RequireAuth>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <RequireAuth user={user}>
                <Questionnaire user={user} />
              </RequireAuth>
            }
          />
          <Route
            path="/matches"
            element={
              <RequireAuth user={user}>
                <Matches user={user} />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:otherId/:otherName"
            element={
              <RequireAuth user={user}>
                <Chat user={user} />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
