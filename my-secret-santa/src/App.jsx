import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import Auth0ProviderWithHistory from "./Auth0ProviderWithHistory";
import { useApollo } from "./apollo";

import AppLayout from "./shell/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewEventPage from "./pages/NewEventPage";
import EventPage from "./pages/EventPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import ProtectedRoute from "./shell/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";


function Providers({ children }) {
  const client = useApollo();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <Providers>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/events" replace />} />
              <Route path="/auth/callback" element={<AuthCallback />} />   {/* <- public */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/new"
                element={
                  <ProtectedRoute>
                    <NewEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <ProtectedRoute>
                    <EventPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/invite/:token" element={<AcceptInvitePage />} />
            </Route>
          </Routes>
        </Providers>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  );
}
