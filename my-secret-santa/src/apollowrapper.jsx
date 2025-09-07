// src/apolloWrapper.jsx
import { useMemo } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth0 } from "@auth0/auth0-react";

const HASURA_URL = import.meta.env.VITE_HASURA_GRAPHQL_URL;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

export default function ApolloWrapper({ children }) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const httpLink = useMemo(
    () => createHttpLink({ uri: HASURA_URL }),
    []
  );

  const authLink = useMemo(
    () =>
      setContext(async (_, { headers }) => {
        let token = "";
        if (isAuthenticated) {
          try {
            token = await getAccessTokenSilently({
              authorizationParams: { audience: AUTH0_AUDIENCE },
            });
          } catch (e) {
            // Non-fatal during initial load
            console.warn("Auth0 token fetch failed:", e);
          }
        }
        if (import.meta.env.DEV && token) {
          const p = JSON.parse(atob(token.split(".")[1]));
          console.log("Hasura token aud:", p.aud);
          console.log("Hasura claims:", p["https://hasura.io/jwt/claims"]);
        }

        return {
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
          },
        };
      }),
    [getAccessTokenSilently, isAuthenticated]
  );

  const client = useMemo(
    () =>
      new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
      }),
    [authLink, httpLink]
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
