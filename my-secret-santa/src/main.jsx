import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App";
import NewEventPage from "./pages/NewEventPage"; // <- create this file
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || "dev-30ivbgqie71nm3uz.us.auth0.com"}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || "NxGBTFIHa48X4VbQUw1fKMOoBCkKxVWl"}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE, // keep if you’re calling Hasura
        scope: "openid profile email",
      }}
    >
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Auth0Provider>
  </BrowserRouter>
);
