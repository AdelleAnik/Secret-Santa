import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

const HASURA_URL = import.meta.env.VITE_HASURA_GRAPHQL_URL;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

export function useApollo() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const httpLink = useMemo(
    () => createHttpLink({ uri: HASURA_URL }),
    []
  );

  const authLink = setContext(async (_, { headers }) => {
    let token = "";
    if (isAuthenticated) {
      token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE }
      });
    }
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : ""
      }
    };
  });

  return useMemo(
    () =>
      new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
      }),
    [authLink, httpLink]
  );
}
