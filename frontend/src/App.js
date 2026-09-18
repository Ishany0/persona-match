import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Questionnaire from "./pages/Questionnaire";
import Matches from "./pages/Matches";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pm_user");
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route
          path="/profile"
          element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/questionnaire"
          element={user ? <Questionnaire user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/matches"
          element={user ? <Matches user={user} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={user ? "/profile" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
