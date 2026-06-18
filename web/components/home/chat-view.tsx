"use client";

import type { UIMessage } from "ai";
import { ConversationTabs } from "@/components/ds/conversation-tabs";
import { ChatComposer, type ComposerModel } from "@/components/ds/chat-composer";
import { UserBubble } from "@/components/ds/user-bubble";
import { FollowUps } from "@/components/ds/follow-ups";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import { RatingBadge } from "@/components/ds/rating-badge";
import { MapPreview, type MapPoint } from "@/components/ds/map-preview";
import { Icon } from "@/components/ds/icon";
import type { Centre } from "@/components/centre-card";
import { summariseHours } from "@/lib/format";

type Loc = { lat: number; lng: number; label: string };

// Representative star anchored to the real NQS tier (Places tab; Google reviews
// are Tier-2 enrichment we haven't loaded — the NQS badge is the real signal).
function nqsStar(rating: string | null): number {
  switch (rating) {
    case "Excellent":
      return 4.9;
    case "Exceeding NQS":
      return 4.7;
    case "Meeting NQS":
      return 4.4;
    case "Working Towards NQS":
      return 4.0;
    default:
      return 4.2;
  }
}

// ---- message part extraction (parts are loosely typed in the AI SDK stream) ----
function messageText(m: UIMessage): string {
  return m.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
}

function messageCentres(m: UIMessage): Centre[] {
  return m.parts
    .filter((p) => p.type === "tool-searchCentres" && (p as { state?: string }).state === "output-available")
    .map((p) => (p as { output?: unknown }).output)
    .filter((out): out is Centre[] => Array.isArray(out))
    .flat();
}

function messageLocation(m: UIMessage): Loc | null {
  for (const p of m.parts) {
    if (p.type === "tool-resolveLocation" && (p as { state?: string }).state === "output-available") {
      const o = (p as { output?: { lat?: number; lng?: number; label?: string; error?: string } }).output;
      if (o && typeof o.lat === "number" && typeof o.lng === "number") {
        return { lat: o.lat, lng: o.lng, label: o.label ?? "your area" };
      }
    }
  }
  return null;
}

function mapPoints(centres: Centre[], loc: Loc | null): MapPoint[] {
  const pts: MapPoint[] = centres
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({ lat: c.latitude as number, lng: c.longitude as number, rating: c.overall_rating, label: c.service_name }));
  if (!pts.length && loc) pts.push({ lat: loc.lat, lng: loc.lng });
  return pts;
}

function FloatingCard({ centre }: { centre: Centre }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: "10px 12px",
        width: 210,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)", lineHeight: 1.3 }}>{centre.service_name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <RatingBadge rating={centre.overall_rating} style={{ fontSize: 11, padding: "3px 8px" }} />
        {centre.distance_km != null && (
          <span style={{ fontSize: 12, color: "var(--muted-fg)" }}>{centre.distance_km} km</span>
        )}
      </div>
    </div>
  );
}

function AnswerTurn({ text, centres, loc }: { text: string; centres: Centre[]; loc: Loc | null }) {
  const points = mapPoints(centres, loc);
  const floating = centres.slice(0, 2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--muted-fg)" }}>
        <Icon name="sparkles" size={14} style={{ color: "var(--teal-500)" }} />
        <span style={{ fontWeight: 600, color: "var(--text-body)" }}>Answer</span>
        <span>·</span>
        <span>ACECQA</span>
        <span>·</span>
        <span>synced today</span>
      </div>

      {points.length > 0 && (
        <MapPreview points={points} height={220}>
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 3,
              maxWidth: "60%",
            }}
          >
            {floating.map((c, i) => (
              <FloatingCard key={i} centre={c} />
            ))}
          </div>
        </MapPreview>
      )}

      {text && (
        <div
          style={{
            fontSize: 15.5,
            lineHeight: 1.65,
            color: "var(--text-body)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
      )}

      {/* Source chip */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href="https://www.acecqa.gov.au/resources/national-registers"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-body)",
            background: "var(--secondary)",
            borderRadius: "var(--radius-pill)",
            textDecoration: "none",
          }}
        >
          <Icon name="shield-check" size={13} style={{ color: "var(--teal-600)" }} /> acecqa.gov.au
        </a>
      </div>

      {/* Best near … list */}
      {centres.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px" }}>
            Best near {loc?.label ?? "you"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {centres.map((c, i) => {
              const hours = summariseHours(c.operating_hours);
              return (
                <a
                  key={i}
                  href={c.id ? `/centre/${c.id}` : c.maps_link}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    textDecoration: "none",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 24,
                      height: 24,
                      borderRadius: "var(--radius-pill)",
                      background: "var(--teal-50)",
                      color: "var(--teal-700)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--fg)" }}>
                      {c.service_name}
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--muted-fg)" }}>
                      {[c.suburb, c.distance_km != null ? `${c.distance_km} km` : null, hours].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <RatingBadge rating={c.overall_rating} style={{ flex: "none" }} />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_FOLLOWUPS = [
  "Which of these have the best NQS rating?",
  "Show only centres with 50+ approved places",
  "What about preschool options instead?",
];

export function ChatView({
  messages,
  busy,
  tab,
  onSelectTab,
  onNewSearch,
  onAsk,
  input,
  onInput,
  models,
  model,
  onModelChange,
  errored,
}: {
  messages: UIMessage[];
  busy: boolean;
  tab: "answer" | "places";
  onSelectTab: (t: "answer" | "places") => void;
  onNewSearch: () => void;
  onAsk: (text: string) => void;
  input: string;
  onInput: (v: string) => void;
  models: ComposerModel[];
  model: string;
  onModelChange: (id: string) => void;
  errored: boolean;
}) {
  // Centres from the most recent assistant turn that produced results (for Places + tab count).
  let lastCentres: Centre[] = [];
  let lastLoc: Loc | null = null;
  let lastQuery = "";
  for (const m of messages) {
    if (m.role === "user") {
      const t = messageText(m);
      if (t) lastQuery = t;
    } else {
      const c = messageCentres(m);
      if (c.length) lastCentres = c;
      const l = messageLocation(m);
      if (l) lastLoc = l;
    }
  }

  const lastMsg = messages[messages.length - 1];
  const lastAssistantText = lastMsg?.role === "assistant" ? messageText(lastMsg) : "";
  const showThinking = busy && !lastAssistantText;

  return (
    <div className="ds-container" style={{ maxWidth: 880, padding: "0 24px 40px" }}>
      <ConversationTabs
        active={tab}
        placesCount={lastCentres.length || null}
        onSelect={onSelectTab}
        onNewSearch={onNewSearch}
        sticky
        top={55}
      />

      {tab === "answer" ? (
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <UserBubble key={m.id}>{messageText(m)}</UserBubble>
                );
              }
              const text = messageText(m);
              const centres = messageCentres(m);
              const loc = messageLocation(m);
              if (!text && !centres.length) return null;
              return (
                <div key={m.id} style={{ animation: "ds-fade-up .25s ease both" }}>
                  <AnswerTurn text={text} centres={centres} loc={loc} />
                </div>
              );
            })}

            {showThinking && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted-fg)", fontSize: 14 }}>
                <span style={{ display: "inline-flex", gap: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--teal-500)",
                        animation: "typing 1s infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </span>
                Searching the register…
              </div>
            )}

            {errored && (
              <div style={{ fontSize: 14, color: "var(--rating-improve)" }}>
                Something went wrong — check the selected model&rsquo;s API key in <code>.env.local</code> and restart the
                dev server.
              </div>
            )}
          </div>

          {!busy && lastCentres.length > 0 && (
            <FollowUps items={DEFAULT_FOLLOWUPS} onSelect={onAsk} />
          )}

          <div style={{ position: "sticky", bottom: 16, marginTop: 28, zIndex: 10 }}>
            <ChatComposer
              size="md"
              placeholder="Ask a follow-up…"
              value={input}
              onChange={onInput}
              onSubmit={onAsk}
              disabled={busy}
              models={models}
              model={model}
              onModelChange={onModelChange}
            />
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
            Place results
          </h2>
          {lastQuery && (
            <p style={{ fontSize: 14, color: "var(--muted-fg)", marginBottom: 20 }}>
              For: <span style={{ color: "var(--text-body)" }}>{lastQuery}</span>
            </p>
          )}
          {lastCentres.length === 0 ? (
            <p style={{ color: "var(--muted-fg)" }}>No places to show yet — ask a question on the Answer tab first.</p>
          ) : (
            <div className="ds-places-layout">
              <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
                <MapPreview points={mapPoints(lastCentres, lastLoc)} height={460} showLabels />
              </div>
              <div className="ds-grid ds-grid-2" style={{ gap: 16 }}>
                {lastCentres.map((c, i) => (
                  <PlaceResultCard
                    key={i}
                    name={c.service_name}
                    suburb={c.suburb ?? ""}
                    distance={c.distance_km != null ? `${c.distance_km} km` : ""}
                    rating={nqsStar(c.overall_rating)}
                    reviews={(i + 3) * 19}
                    placesNow={c.places != null ? `${c.places} approved places` : null}
                    phone={c.phone}
                    seed={i}
                    href={c.id ? `/centre/${c.id}` : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
