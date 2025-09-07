// src/components/Header.jsx
import { useAuth0 } from "@auth0/auth0-react";

export default function Header() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid #eee",
      }}
    >
      <h2 style={{ margin: 0 }}>🎁 Secret Santa</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {isLoading ? (
          <span>Loading...</span>
        ) : isAuthenticated ? (
          <>
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: 36, height: 36, borderRadius: "50%" }}
              />
            )}
            <button
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </header>
  );
}
