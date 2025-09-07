import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { useState } from "react";

import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Stack,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";

export default function NewEventPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [form, setForm] = useState({ name: "", description: "", date: "" });

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate with Hasura
    alert(`Event "${form.name}" created!`);
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

              <TextField
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ alignSelf: "flex-start" }}
              >
                Create Event
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
