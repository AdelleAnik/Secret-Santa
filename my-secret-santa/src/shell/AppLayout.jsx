import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } = useAuth0();
  const loc = useLocation();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        padding: 16, borderBottom: "1px solid #eee",
        display: "flex", alignItems: "center", gap: 12
      }}>
        <Link to="/events" style={{ fontWeight: 700, textDecoration: "none" }}>
          🎁 Secret Santa
        </Link>
        <div style={{ flex: 1 }} />
        {isLoading ? null : isAuthenticated ? (
          <>
            <span style={{ opacity: 0.8 }}>{user?.email}</span>
            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </header>
      <main style={{ padding: 24 }}>
        <Outlet key={loc.key} />
      </main>
    </div>
  );
}
