import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // send the user back to where they were going after login
      loginWithRedirect({ appState: { returnTo: location.pathname + location.search } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, location.pathname, location.search]);

  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{String(error)}</div>;
  if (!isAuthenticated) return null; // waiting for login redirect

  return children;
}
