// src/components/Header.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Typography } from "@mui/material";

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
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          letterSpacing: .3,
          background: "linear-gradient(90deg, #fff, #f6d26b, #fff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Secret Santa
      </Typography>
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
            <Button
              // sx={{
              //   borderRadius: 2,
              //   bgcolor: "var(--xmas-red)",
              //   ":hover": { bgcolor: "#a81f27" },
              //   boxShadow: "0 8px 24px rgba(214,43,53,.32)",
              // }}
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Logout
            </Button>
          </>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </header>
  );
}
