// import { gql } from "@apollo/client";
// import { useMutation } from "@apollo/client/react/hooks";
import { gql, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";

const CREATE_EVENT = gql`
  mutation CreateEvent($name: String!, $description: String, $draw_at: timestamptz) {
    insert_events_one(object: {
      name: $name, description: $description, draw_at: $draw_at, status: "open"
    }) { id }
  }
`;

const ADD_SELF = gql`
  mutation AddSelfAsAdmin($event_id: uuid!, $email: citext!, $name: String) {
    insert_participants_one(object: {
      event_id: $event_id, email: $email, name: $name, is_admin: true, joined: true
    }) { id }
  }
`;

export default function NewEventPage() {
  const nav = useNavigate();
  const { user } = useAuth0();
  const [form, setForm] = useState({ name: "", description: "", draw_at: "" });
  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT);
  const [addSelf] = useMutation(ADD_SELF);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await createEvent({
      variables: {
        name: form.name.trim(),
        description: form.description.trim() || null,
        draw_at: form.draw_at ? new Date(form.draw_at).toISOString() : null
      }
    });
    const eventId = res?.data?.insert_events_one?.id;
    if (eventId) {
      await addSelf({
        variables: {
          event_id: eventId,
          email: user?.email,
          name: user?.name || user?.email?.split("@")[0] || null
        }
      });
      nav(`/events/${eventId}`);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Create Event</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>Event name
          <input required value={form.name}
                 onChange={e=>setForm(s=>({...s, name: e.target.value}))} />
        </label>
        <label>Description
          <textarea value={form.description}
                    onChange={e=>setForm(s=>({...s, description: e.target.value}))} />
        </label>
        <label>Draw at (optional)
          <input type="datetime-local" value={form.draw_at}
                 onChange={e=>setForm(s=>({...s, draw_at: e.target.value}))} />
        </label>
        <button disabled={creating} type="submit">Create</button>
      </form>
    </div>
  );
}
