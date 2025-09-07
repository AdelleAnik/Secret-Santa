import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect } from "react";

const INVITE_LOOKUP = gql`
  query InviteLookup($token: uuid!) {
    participants(where: { invite_token: { _eq: $token } }, limit: 1) {
      id
      event_id
      email
      joined
      user_auth0_id
      event { name }
    }
  }
`;

const ACCEPT_INVITE = gql`
  mutation AcceptInvite($id: uuid!, $user_id: String!, $email: String) {
    update_participants_by_pk(
      pk_columns: { id: $id },
      _set: { user_auth0_id: $user_id, joined: true, email: $email }
    ) {
      id
      event_id
    }
  }
`;

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();

  // You can store tokens as uuid; change type to String if you used text
  const { data, loading, error } = useQuery(INVITE_LOOKUP, {
    variables: { token },
    fetchPolicy: "network-only"
  });

  const [acceptInvite, { loading: saving, error: saveError }] = useMutation(ACCEPT_INVITE);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: `/invite/${token}` }
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, token]);

  if (loading || isLoading) return <Box sx={{ p: 3 }}>Loading…</Box>;
  if (error) return <Box sx={{ p: 3, color: "red" }}>{error.message}</Box>;

  const row = data?.participants?.[0];
  if (!row) return <Box sx={{ p: 3 }}>Invalid or expired invite.</Box>;

  const goToEvent = (eventId) => navigate(`/events/${eventId}`);

  const handleAccept = async () => {
    const res = await acceptInvite({
      variables: {
        id: row.id,
        user_id: user.sub,
        email: user.email || row.email || null
      }
    });
    goToEvent(res.data.update_participants_by_pk.event_id);
  };

  // Already claimed?
  if (row.joined || row.user_auth0_id) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">You’re already on this event.</Typography>
          <Button variant="contained" onClick={() => goToEvent(row.event_id)}>Go to event</Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, m: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">You’ve been invited to: {row.event?.name || "Secret Santa"}</Typography>
        <Typography>Continue as <b>{user?.email}</b>?</Typography>
        {saveError && <Typography color="error">{saveError.message}</Typography>}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" disabled={saving} onClick={handleAccept}>
            {saving ? "Joining…" : "Accept invite"}
          </Button>
          <Button variant="outlined" onClick={() => goToEvent(row.event_id)}>
            View event
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
