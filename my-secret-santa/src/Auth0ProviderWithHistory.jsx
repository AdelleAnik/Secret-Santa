import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const DOMAIN   = import.meta.env.VITE_AUTH0_DOMAIN;
const CLIENTID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

export default function Auth0ProviderWithHistory({ children }) {
  const navigate = useNavigate();
  const onRedirectCallback = (appState) => {
    const target = appState?.returnTo ?? "/events";
    navigate(target, { replace: true });
  };

  return (
    <Auth0Provider
      domain={DOMAIN}
      clientId={CLIENTID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/auth/callback`, 
        audience: AUDIENCE,
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}
