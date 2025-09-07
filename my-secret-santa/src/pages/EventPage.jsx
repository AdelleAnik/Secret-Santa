// import { gql } from "@apollo/client";
// import { useQuery, useMutation } from "@apollo/client/react/hooks";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useMemo, useState } from "react";

const EVENT_DETAIL = gql`
  query EventDetail($id: uuid!) {
    events_by_pk(id: $id) { id name status created_by }
    participants(where: { event_id: { _eq: $id } }, order_by: { created_at: asc }) {
      id name email is_admin joined user_auth0_id
    }
    exclusions(where: { event_id: { _eq: $id } }) {
      id from_participant to_participant
    }
    assignments(where: { event_id: { _eq: $id } }) {
      id giver_participant receiver_participant
      giver { id user_auth0_id name }
      receiver { id name email }
    }
  }
`;

const INVITE_MANY = gql`
  mutation InviteMany($objects: [participants_insert_input!]!) {
    insert_participants(objects: $objects, on_conflict: {
      constraint: participants_event_id_email_key,
      update_columns: [name]
    }) {
      returning { id email invite_token }
    }
  }
`;

const ADD_EXCLUSION = gql`
  mutation AddExclusion($event_id: uuid!, $from: uuid!, $to: uuid!) {
    insert_exclusions_one(object: {
      event_id: $event_id, from_participant: $from, to_participant: $to
    }) { id }
  }
`;

export default function EventPage() {
  const { eventId } = useParams();
  const { user } = useAuth0();
  const { data, loading, error, refetch } = useQuery(EVENT_DETAIL, { variables: { id: eventId } });
  const [inviteInput, setInviteInput] = useState(""); // one email per line: "Name <email>" or just email
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [inviteMany, { loading: inviting }] = useMutation(INVITE_MANY);
  const [addExclusion, { loading: addingEx }] = useMutation(ADD_EXCLUSION);

  const ownerView = useMemo(() => {
    const created_by = data?.events_by_pk?.created_by;
    return created_by && user?.sub && created_by === user.sub;
  }, [data, user]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>{error.message}</div>;
  const ev = data.events_by_pk;
  const participants = data.participants ?? [];
  const myParticipant = participants.find(p => p.user_auth0_id && p.user_auth0_id === user?.sub);

  const myAssign = (data.assignments ?? []).find(a => a.giver?.id === myParticipant?.id);

  const onInvite = async () => {
    const lines = inviteInput.split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    const objects = lines.map(line => {
      // supports "Name <email@x.com>" or just "email@x.com"
      const m = line.match(/^(.*)<([^>]+)>$/);
      if (m) {
        return { event_id: ev.id, email: m[2].trim().toLowerCase(), name: m[1].trim() || null };
      }
      return { event_id: ev.id, email: line.toLowerCase(), name: null };
    });

    await inviteMany({ variables: { objects } });
    setInviteInput("");
    refetch();
  };

  const onAddExclusion = async () => {
    if (!fromId || !toId || fromId === toId) return;
    await addExclusion({ variables: { event_id: ev.id, from: fromId, to: toId }});
    setFromId(""); setToId("");
    refetch();
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h2>{ev.name}</h2>

      <section>
        <h3>Participants</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {participants.map(p => (
            <li key={p.id} style={{ padding: 8, borderBottom: "1px solid #eee",
              display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 220 }}>{p.name || "(no name)"} </div>
              <div style={{ width: 280, opacity: 0.8 }}>{p.email}</div>
              {p.is_admin && <span style={{ fontSize: 12, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 12 }}>admin</span>}
              {p.joined ? <span title="Joined">✅</span> : <span title="Not joined">⏳</span>}
            </li>
          ))}
        </ul>

        {ownerView && (
          <div style={{ marginTop: 16 }}>
            <h4>Invite by email (one per line)</h4>
            <textarea rows={5} style={{ width: "100%", maxWidth: 600 }}
              placeholder={`alice@example.com\nBob <bob@ex.com>`}
              value={inviteInput} onChange={e=>setInviteInput(e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <button onClick={onInvite} disabled={inviting}>Add / Update Invites</button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3>Exclusions (A cannot draw B)</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={fromId} onChange={e=>setFromId(e.target.value)}>
            <option value="">From…</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.name || p.email}</option>)}
          </select>
          <span>cannot draw</span>
          <select value={toId} onChange={e=>setToId(e.target.value)}>
            <option value="">To…</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.name || p.email}</option>)}
          </select>
          <button onClick={onAddExclusion} disabled={addingEx}>Add</button>
        </div>
        <ul>
          {(data.exclusions ?? []).map(ex => {
            const from = participants.find(p => p.id === ex.from_participant);
            const to = participants.find(p => p.id === ex.to_participant);
            return <li key={ex.id}>{(from?.name || from?.email) ?? "?"} → {(to?.name || to?.email) ?? "?"}</li>;
          })}
        </ul>
      </section>

      <section>
        <h3>My Assignment</h3>
        {myAssign ? (
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, maxWidth: 420 }}>
            <div>You will give a gift to:</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>
              {myAssign.receiver?.name || myAssign.receiver?.email || "TBA"}
            </div>
          </div>
        ) : (
          <div>No assignment yet (draw not run or you’re not a giver).</div>
        )}
      </section>
    </div>
  );
}
