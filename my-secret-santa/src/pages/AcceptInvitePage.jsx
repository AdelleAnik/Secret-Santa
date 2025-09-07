import { useParams, useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

const CLAIM_INVITE = gql`
  mutation ClaimInvite($token: uuid!, $user_auth0_id: String!) {
    update_participants(
      where: { invite_token: { _eq: $token }, _and: [{ user_auth0_id: { _is_null: true } }] },
      _set: { user_auth0_id: $user_auth0_id, joined: true }
    ) {
      affected_rows
      returning { event_id }
    }
  }
`;

export default function AcceptInvitePage() {
  const { token } = useParams();
  const nav = useNavigate();
  const { isAuthenticated, loginWithRedirect, isLoading, user } = useAuth0();
  const [claimInvite] = useMutation(CLAIM_INVITE);
  const [msg, setMsg] = useState("Checking…");

  useEffect(() => {
    (async () => {
      if (isLoading) return;
      if (!isAuthenticated) {
        await loginWithRedirect({ appState: { returnTo: `/invite/${token}` } });
        return;
      }
      try {
        const res = await claimInvite({
          variables: { token, user_auth0_id: user.sub }
        });
        const eventId = res?.data?.update_participants?.returning?.[0]?.event_id;
        if (eventId) {
          setMsg("Invite accepted! Redirecting…");
          setTimeout(()=>nav(`/events/${eventId}`), 800);
        } else {
          setMsg("This invite was already claimed or is invalid.");
        }
      } catch (e) {
        setMsg(`Error: ${e.message}`);
      }
    })();
  }, [isLoading, isAuthenticated, user, token, claimInvite, nav, loginWithRedirect]);

  return <div style={{ padding: 24 }}>{msg}</div>;
}
