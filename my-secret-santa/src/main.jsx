import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App";
import NewEventPage from "./pages/NewEventPage";
import EventPage from "./pages/EventPage";
import ApolloWrapper from "./apolloWrapper";  
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || "dev-30ivbgqie71nm3uz.us.auth0.com"}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || "NxGBTFIHa48X4VbQUw1fKMOoBCkKxVWl"}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE, 
        scope: "openid profile email",
      }}
    >
      <ApolloWrapper>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/events/new" element={<NewEventPage />} />
          <Route path="/events/:eventId" element={<EventPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ApolloWrapper>
    </Auth0Provider>
  </BrowserRouter>
);
