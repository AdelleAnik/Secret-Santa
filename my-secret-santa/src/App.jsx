// src/App.jsx
import "./App.css";
import Header from "./components/Header";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  return (
    <div>
      <Header />
      <main style={{ padding: "2rem" }}>
        <h1>Welcome to Secret Santa 🎅</h1>
        <p>Login to create an event, invite participants, and draw names.</p>

        {isAuthenticated && (
          <button
            onClick={() => navigate("/events/new")}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            ➕ Create Event
          </button>
        )}
      </main>
    </div>
  );
}
