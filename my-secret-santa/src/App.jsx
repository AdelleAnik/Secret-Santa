// src/App.jsx
import "./App.css";
import Header from "./components/Header";
import { useAuth0 } from "@auth0/auth0-react";
import ViewEventsPage from "./pages/ViewEventsPage";
import Snow from "./components/Snow";

export default function App() {
  const { isAuthenticated } = useAuth0();

  return (
    <div>
      <Header />
      <Snow />

      {/* When logged in, show events instead of the welcome text */}
      {isAuthenticated ? (
        <ViewEventsPage />
      ) : (
        <main style={{ padding: "2rem" }}>
          <h1>Welcome to Secret Santa 🎅</h1>
          <p>Login to create an event, invite participants, and draw names.</p>
        </main>
      )}
    </div>
  );
}
