import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Container,
  Paper,
  Stack,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import RuleIcon from "@mui/icons-material/Rule";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import { gql, useMutation, useQuery } from "@apollo/client";

// ---- GraphQL ----

const EVENT_DETAIL = gql`
  query EventDetail($id: uuid!) {
    events_by_pk(id: $id) {
      id
      name
      description
      status
      draw_at
      created_by
      created_at
    }
    participants(where: { event_id: { _eq: $id } }, order_by: { created_at: asc }) {
      id
      name
      email
      is_admin
      joined
      user_auth0_id
      invite_token
    }
     exclusions(where: { event_id: { _eq: $id } }, order_by: { id: asc }) {
      id
      from_participant
      to_participant
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: uuid!, $name: String!, $description: String, $draw_at: timestamptz) {
    update_events_by_pk(pk_columns: { id: $id }, _set: { name: $name, description: $description, draw_at: $draw_at }) {
      id
    }
  }
`;

/** NEW: invite one participant (DB generates invite_token) */
const INVITE_PARTICIPANT = gql`
  mutation InviteParticipant($event_id: uuid!, $email: String!, $name: String) {
    insert_participants_one(object: { event_id: $event_id, email: $email, name: $name }) {
      id
      invite_token
      email
      name
      joined
    }
  }
`;

const ADD_EXCLUSION = gql`
  mutation AddExclusion($event_id: uuid!, $from: uuid!, $to: uuid!) {
    insert_exclusions_one(
      object: { event_id: $event_id, from_participant: $from, to_participant: $to }
    ) {
      id
    }
  }
`;

// ---- Component ----

export default function EventPage() {
  const { eventId } = useParams();
  const { user } = useAuth0();

  // Load event + participants + exclusions
  const { data, loading, error, refetch } = useQuery(EVENT_DETAIL, {
    variables: { id: eventId },
    fetchPolicy: "cache-and-network",
  });

  const [updateEvent, { loading: saving }] = useMutation(UPDATE_EVENT);
  const [inviteOne, { loading: inviting, error: inviteError }] = useMutation(INVITE_PARTICIPANT, {
    refetchQueries: [{ query: EVENT_DETAIL, variables: { id: eventId } }],
  });
  const [addExclusion, { loading: addingRule }] = useMutation(ADD_EXCLUSION);

  const ev = data?.events_by_pk;
  const participants = data?.participants ?? [];
  const exclusions = data?.exclusions ?? [];

  // Owner/admin detection
  const isOwner = useMemo(
    () => !!(ev?.created_by && user?.sub && ev.created_by === user.sub),
    [ev, user]
  );
  const myParticipant = useMemo(
    () =>
      participants.find((p) => p.user_auth0_id && user?.sub && p.user_auth0_id === user.sub),
    [participants, user]
  );
  const isAdmin = useMemo(() => isOwner || !!(myParticipant && myParticipant.is_admin), [isOwner, myParticipant]);

  // Local form state for event fields
  const [form, setForm] = useState({
    name: ev?.name || "",
    description: ev?.description || "",
  });
  useMemo(() => {
    if (ev) setForm({ name: ev.name ?? "", description: ev.description ?? "" });
  }, [ev?.id, ev?.name, ev?.description]);

  // NEW: Invite form state + copy feedback
  const [inviteForm, setInviteForm] = useState({ email: "", name: "" });
  const [copiedId, setCopiedId] = useState(null);

  // Exclusion selectors
  const [fromParticipant, setFromParticipant] = useState(null);
  const [toParticipant, setToParticipant] = useState(null);

  if (loading && !data) {
    return (
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Paper sx={{ p: 4, display: "flex", gap: 2, alignItems: "center" }}>
          <CircularProgress size={20} />
          <Typography>Loading event…</Typography>
        </Paper>
      </Container>
    );
  }
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Alert severity="error">{error.message}</Alert>
      </Container>
    );
  }
  if (!ev) {
    return (
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Alert severity="warning">Event not found.</Alert>
      </Container>
    );
  }

  // Handlers
  const handleEventSave = async () => {
    await updateEvent({
      variables: { id: ev.id, name: form.name.trim(), description: form.description.trim() || null },
    });
    refetch();
  };

  /** NEW: invite single email */
  const handleInvite = async (e) => {
    e?.preventDefault?.();
    const email = inviteForm.email.trim().toLowerCase();
    if (!email) return;

    await inviteOne({
      variables: {
        event_id: ev.id,
        email,
        name: inviteForm.name.trim() || null,
      },
    });

    setInviteForm({ email: "", name: "" });
  };

  /** NEW: copy invite link for a pending participant */
  const copyLink = async (token, id) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleAddRule = async () => {
    if (!fromParticipant?.id || !toParticipant?.id) return;
    if (fromParticipant.id === toParticipant.id) return;
    await addExclusion({
      variables: { event_id: ev.id, from: fromParticipant.id, to: toParticipant.id },
    });
    setFromParticipant(null);
    setToParticipant(null);
    refetch();
  };

  // Derive pending list (not joined yet)
  const pendingInvites = (participants || []).filter((p) => !p.joined);

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box component={Paper} elevation={2} sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Typography variant="h5" fontWeight={700}>Event</Typography>
            <Typography variant="body2" color="text.secondary">
              Status: <Chip size="small" label={ev.status} sx={{ ml: 1 }} />
            </Typography>
          </Box>
          {isAdmin ? (
            <Chip icon={<AdminPanelSettingsIcon />} color="primary" label={isOwner ? "Owner" : "Admin"} variant="outlined" />
          ) : null}
        </Box>

        {/* Event details */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Details</Typography>
            <TextField
              label="Event Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              fullWidth
              disabled={!isAdmin}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              disabled={!isAdmin}
            />
            <Box display="flex" gap={1}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleEventSave} disabled={!isAdmin || saving}>
                Save
              </Button>
              <IconButton aria-label="refresh" onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Stack>
        </Paper>

        {/* Participants */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Participants</Typography>

            <Box sx={{ display: "grid", gap: 1 }}>
              {participants.length === 0 ? (
                <Typography color="text.secondary">No participants yet.</Typography>
              ) : (
                participants.map((p) => (
                  <Box
                    key={p.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.25,
                      border: "1px solid #eee",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box>
                        <Typography fontWeight={600}>{p.name || p.email}</Typography>
                        <Typography variant="body2" color="text.secondary">{p.email}</Typography>
                      </Box>
                      {p.is_admin && <Chip size="small" label="admin" variant="outlined" />}
                    </Box>
                    {p.joined ? (
                      <Chip size="small" icon={<CheckCircleIcon color="success" />} label="Joined" variant="outlined" />
                    ) : (
                      <Chip size="small" icon={<HourglassEmptyIcon />} label="Invited" variant="outlined" />
                    )}
                  </Box>
                ))
              )}
            </Box>

            {isAdmin && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1">Invite by email</Typography>

                {/* NEW invite row */}
                <Box component="form" onSubmit={handleInvite}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((s) => ({ ...s, email: e.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Name (optional)"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm((s) => ({ ...s, name: e.target.value }))}
                      fullWidth
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      disabled={inviting}
                    >
                      {inviting ? "Inviting…" : "Invite"}
                    </Button>
                  </Stack>
                </Box>

                {inviteError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {inviteError.message}
                  </Typography>
                )}

                {/* NEW pending list with copy buttons */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Pending invites</Typography>

                {pendingInvites.length === 0 ? (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>No pending invites.</Typography>
                ) : (
                  <List dense disablePadding>
                    {pendingInvites.map((p) => (
                      <ListItem
                        key={p.id}
                        secondaryAction={
                          <Tooltip title={copiedId === p.id ? "Copied!" : "Copy invite link"}>
                            <IconButton edge="end" onClick={() => copyLink(p.invite_token, p.id)}>
                              {copiedId === p.id ? <CheckIcon /> : <ContentCopyIcon />}
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemText primary={p.name || p.email} secondary={p.email} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </Stack>
        </Paper>

        {/* Rules (exclusions) */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Rules: “A cannot draw B”</Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <Autocomplete
                value={fromParticipant}
                onChange={(_, v) => setFromParticipant(v)}
                options={participants}
                getOptionLabel={(o) => o?.name || o?.email || ""}
                sx={{ minWidth: 260 }}
                renderInput={(params) => <TextField {...params} label="From (giver)" />}
              />
              <Typography>cannot draw</Typography>
              <Autocomplete
                value={toParticipant}
                onChange={(_, v) => setToParticipant(v)}
                options={participants}
                getOptionLabel={(o) => o?.name || o?.email || ""}
                sx={{ minWidth: 260 }}
                renderInput={(params) => <TextField {...params} label="To (recipient)" />}
              />
              <Button
                variant="outlined"
                startIcon={<RuleIcon />}
                onClick={handleAddRule}
                disabled={!isAdmin || addingRule}
              >
                Add Rule
              </Button>
            </Box>

            {exclusions.length ? (
              <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
                {exclusions.map((ex) => {
                  const from = participants.find((p) => p.id === ex.from_participant);
                  const to = participants.find((p) => p.id === ex.to_participant);
                  return (
                    <Chip
                      key={ex.id}
                      label={`${from?.name || from?.email || "?"}  →  ${to?.name || to?.email || "?"}`}
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            ) : (
              <Typography color="text.secondary">No rules yet. Add exclusions to avoid drawing partners, etc.</Typography>
            )}
          </Stack>
        </Paper>

        {/* (Optional) Run draw placeholder */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ flex: 1 }}>
              Run Draw (coming next)
            </Typography>
            <Button variant="contained" color="secondary" startIcon={<SendIcon />} disabled title="We’ll wire this as a Hasura Action next">
              Run Draw
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
