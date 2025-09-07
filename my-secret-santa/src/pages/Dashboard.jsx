// import { gql } from "@apollo/client";
// import { useQuery } from "@apollo/client/react/hooks";
import { gql, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";

const MY_EVENTS = gql`
  query MyEvents {
    events(order_by: { created_at: desc }) {
      id
      name
      status
      created_at
    }
  }
`;

export default function Dashboard() {
  const { data, loading, error } = useQuery(MY_EVENTS);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>{error.message}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>My Events</h2>
        <Link to="/events/new"><button>Create Event</button></Link>
      </div>

      {data.events.length === 0 ? (
        <div>No events yet. Create one!</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {data.events.map(e => (
            <li key={e.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <Link to={`/events/${e.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{e.name}</Link>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(e.created_at).toLocaleString()}</div>
                </div>
                <span style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 999 }}>
                  {e.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
