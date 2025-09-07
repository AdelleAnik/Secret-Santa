// src/pages/NewEventPage.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Stack,
  Divider,
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

  const [createEvent, { loading: creating, error: createError }] =
    useMutation(CREATE_EVENT);
  const [addCreator] = useMutation(ADD_CREATOR_PARTICIPANT);

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const draw_at = form.date ? form.date.toDate().toISOString() : null;

    // 1) Create event
    const { data } = await createEvent({
      variables: {
        name: form.name.trim(),
        description: form.description.trim() || null,
        draw_at,
      },
    });

    const eventId = data.insert_events_one.id;

    // 2) Add creator as admin participant
    await addCreator({
      variables: {
        event_id: eventId,
        user_id: user.sub,
        email: user.email || "",
      },
    });

    // 3) Go to event
    navigate(`/events/${eventId}`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 }, mb: 8, position: "relative", zIndex: 1 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: "1px solid var(--border)",
          bgcolor: "var(--card-bg)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 28px rgba(0,0,0,.35)",
          position: "relative",
          ":before": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: "1px",
            background:
              "linear-gradient(135deg, rgba(246,210,107,.55), rgba(255,255,255,0) 40%, rgba(30,122,75,.35))",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          },
        }}
      >
        {/* Heading */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <EventIcon
            sx={{
              color: "var(--xmas-gold)",
              fontSize: 32,
              filter: "drop-shadow(0 0 8px rgba(246,210,107,.55))",
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              letterSpacing: 0.3,
              background: "linear-gradient(90deg, #fff, #f6d26b, #fff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 16px rgba(246,210,107,.25)",
            }}
          >
            Create a New Event
          </Typography>
        </Stack>

        <Divider sx={{ borderColor: "var(--border)", mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Event Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                },
              }}
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              minRows={3}
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                },
              }}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Event Date"
                value={form.date}
                onChange={(newValue) =>
                  setForm((s) => ({ ...s, date: newValue }))
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      sx: {
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border)",
                        color: "#fff",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            {createError && (
              <Typography color="error" variant="body2">
                {createError.message}
              </Typography>
            )}

            <Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={creating}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 800,
                  letterSpacing: 0.35,
                  bgcolor: "var(--xmas-green)",
                  ":hover": { bgcolor: "#176240" },
                  boxShadow: "0 8px 24px rgba(30,122,75,.3)",
                }}
              >
                {creating ? "Creating…" : "Create Event"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
