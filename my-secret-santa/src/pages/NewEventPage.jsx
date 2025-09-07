import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Container, Typography, TextField, Button, Box, Paper, Stack,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";

// MUI X Date Pickers
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// 👉 Apollo v3 imports
import { gql, useMutation } from "@apollo/client";

const CREATE_EVENT = gql`
  mutation CreateEvent($name: String!, $description: String, $draw_at: timestamptz) {
    insert_events_one(object: { name: $name, description: $description, draw_at: $draw_at }) {
      id
    }
  }
`;

const ADD_CREATOR_PARTICIPANT = gql`
  mutation AddCreator($event_id: uuid!, $user_id: String!, $email: String) {
    insert_participants_one(
      object: {
        event_id: $event_id
        user_auth0_id: $user_id
        email: $email
        is_admin: true
        joined: true
      }
    ) {
      id
    }
  }
`;

export default function NewEventPage() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", date: null });

  const [createEvent, { loading: creating, error: createError }] = useMutation(CREATE_EVENT);
  const [addCreator] = useMutation(ADD_CREATOR_PARTICIPANT);

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const draw_at = form.date ? form.date.toDate().toISOString() : null;

    // 1. Create the event
    const { data } = await createEvent({
      variables: {
        name: form.name.trim(),
        description: form.description.trim() || null,
        draw_at,
      },
    });

    const eventId = data.insert_events_one.id;

    // 2. Add creator as participant (admin)
    await addCreator({
      variables: {
        event_id: eventId,
        user_id: user.sub,       // from Auth0 token
        email: user.email || "", // safe fallback
      },
    });

    // 3. Redirect to the event page
    navigate(`/events/${eventId}`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={600}>
              Create a New Event
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Event Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Event Date"
                  value={form.date}
                  onChange={(newValue) => setForm((s) => ({ ...s, date: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>

              {createError && (
                <Typography color="error" variant="body2">
                  {createError.message}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={creating}
                sx={{ alignSelf: "flex-start" }}
              >
                {creating ? "Creating…" : "Create Event"}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
