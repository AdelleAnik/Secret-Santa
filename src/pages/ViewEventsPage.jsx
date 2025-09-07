import { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import GiftIcon from "@mui/icons-material/CardGiftcard";

const MY_EVENTS = gql`
  query MyEvents {
    events(order_by: { created_at: desc }) {
      id
      name
      status
      created_at
      draw_at
    }
  }
`;

const statusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return "default";
    case "ready":
      return "success";
    case "drawn":
      return "info";
    case "archived":
      return "warning";
    default:
      return "default";
  }
};

export default function ViewEventsPage() {
  const { data, loading, error, refetch } = useQuery(MY_EVENTS, {
    fetchPolicy: "cache-and-network",
  });

  const [q, setQ] = useState("");

  const items = data?.events ?? [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((e) => (e.name || "").toLowerCase().includes(term));
  }, [items, q]);

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 8, position: "relative", zIndex: 1 }}>
      {/* Title */}
      <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <GiftIcon sx={{ color: "var(--xmas-gold)", fontSize: 36, filter: "drop-shadow(0 0 8px rgba(246,210,107,.6))" }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.3,
              textShadow: "0 0 18px rgba(246,210,107,.25)",
              background: "linear-gradient(90deg, #fff, #f6d26b, #fff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            My Events
          </Typography>
        </Stack>

       {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ width: "100%", maxWidth: 720 }}>
          <TextField
            placeholder="Search events…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
            size="medium"
            InputProps={{
              sx: {
                height: 56,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(6px)",
                color: "#fff",
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ opacity: 0.8 }} />
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Refresh">
            <IconButton
              onClick={() => refetch()}
              size="large"
              sx={{
                height: 56,
                width: 56,
                borderRadius: 2,
                border: "1px solid var(--border)",
                bgcolor: "rgba(255,255,255,0.06)",
                ":hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            component={RouterLink}
            to="/events/new"
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{
              height: 56,
              borderRadius: 2,
              px: 2.5,
              fontWeight: 700,
              letterSpacing: 0.3,
              bgcolor: "var(--xmas-green)",
              ":hover": { bgcolor: "#176240" },
              boxShadow: "0 8px 24px rgba(30,122,75,.3)",
            }}
          >
            Create Event
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ borderColor: "var(--border)", mb: 3 }} />

      {/* Content */}
      {loading && !data ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={84} sx={{ bgcolor: "rgba(255,255,255,.08)" }} />
          ))}
        </Stack>
      ) : error ? (
        <Typography color="error">{error.message}</Typography>
      ) : filtered.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "1px dashed var(--border)",
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,.03)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No events yet
          </Typography>
          <Typography  sx={{ mb: 2 }}>
            Create your first Secret Santa event.
          </Typography>
          <Button
            component={RouterLink}
            to="/events/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              bgcolor: "var(--xmas-red)",
              ":hover": { bgcolor: "#a81f27" },
              boxShadow: "0 8px 24px rgba(214,43,53,.32)",
            }}
          >
            Create Event
          </Button>
        </Box>
      ) : (
        <List disablePadding sx={{ display: "grid", gap: 3 }}>
          {filtered.map((e) => (
            <ListItem
              key={e.id}
              component={RouterLink}
              to={`/events/${e.id}`}
              sx={{
                display: "block",
                p: 0,
                borderRadius: 2.5,
                border: "1px solid var(--border)",
                bgcolor: "var(--card-bg)",
                backdropFilter: "blur(6px)",
                transition: "all .18s ease",
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 26px rgba(0,0,0,.35), 0 0 0 1px rgba(246,210,107,.22) inset",
                },
              }}
            >
              <Box sx={{ p: 2.25 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: .2,
                        color: "#fff",
                      }}
                    >
                      {e.name}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={statusColor(e.status)}
                      label={e.status}
                      sx={{
                        borderColor: "rgba(255,255,255,.25)",
                        color: "#fff",
                        textTransform: "capitalize",
                      }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: "var(--xmas-gold)" }}>
                    🎁
                  </Typography>
                </Stack>

                <ListItemText
                  sx={{ mt: .5 }}
                  secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,.7)" } }}
                  secondary={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: .5, sm: 2 }}>
                      <span>Created: {new Date(e.created_at).toLocaleString()}</span>
                      {e.draw_at && <span>Draw: {new Date(e.draw_at).toLocaleString()}</span>}
                    </Stack>
                  }
                />
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}
