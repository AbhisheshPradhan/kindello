import { Clock, MapPin, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Shape of one row from the `searchCentres` tool (lib/tools.ts).
export type Centre = {
  id?: string;
  service_name: string;
  service_address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  overall_rating: string | null;
  phone: string | null;
  operating_hours: OperatingHours | null;
  places: number | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km: number | null;
  maps_link: string;
  match?: string;
};

type DayHours = { start?: string; end?: string };
type OperatingHours = Record<string, Record<string, DayHours>>;

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const ABBR: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, "0")}${ap}`;
}

// "Mon–Fri 9:30am–5:30pm, Sat 10am–2pm" — collapses consecutive same-hours days.
function summariseHours(oh: OperatingHours | null): string | null {
  if (!oh) return null;
  const session =
    oh.annual ??
    oh.school_terms_session_1 ??
    oh.school_terms_session_2 ??
    oh.holiday_care;
  if (!session) return null;

  const present = DAYS.filter((d) => session[d]?.start && session[d]?.end);
  if (!present.length) return null;

  const groups: { days: string[]; start: string; end: string }[] = [];
  for (const d of present) {
    const { start, end } = session[d] as { start: string; end: string };
    const last = groups[groups.length - 1];
    const lastDay = last?.days[last.days.length - 1];
    const consecutive =
      lastDay !== undefined && DAYS.indexOf(d) === DAYS.indexOf(lastDay) + 1;
    if (last && last.start === start && last.end === end && consecutive) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], start, end });
    }
  }

  return groups
    .map((g) => {
      const span =
        g.days.length > 1
          ? `${ABBR[g.days[0]]}–${ABBR[g.days[g.days.length - 1]]}`
          : ABBR[g.days[0]];
      return `${span} ${to12h(g.start)}–${to12h(g.end)}`;
    })
    .join(", ");
}

// NQS rating → badge label + theme-aware colours (best to worst).
function ratingBadge(rating: string | null): { label: string; className: string } {
  switch (rating) {
    case "Excellent":
      return {
        label: "Excellent",
        className: "bg-primary text-primary-foreground",
      };
    case "Exceeding NQS":
      return {
        label: "Exceeding",
        className: "bg-primary/15 text-primary ring-1 ring-primary/30",
      };
    case "Meeting NQS":
      return {
        label: "Meeting",
        className:
          "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:text-blue-400",
      };
    case "Working Towards NQS":
      return {
        label: "Working towards",
        className:
          "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
      };
    case "Significant Improvement Required":
      return {
        label: "Improvement required",
        className: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
      };
    default:
      return {
        label: "Not yet rated",
        className: "bg-muted text-muted-foreground ring-1 ring-border",
      };
  }
}

function CentreCard({ centre, index }: { centre: Centre; index: number }) {
  const hours = summariseHours(centre.operating_hours);
  const badge = ratingBadge(centre.overall_rating);
  const place = [centre.suburb, centre.state, centre.postcode]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      // Staggered fade/slide-in so results visibly stream in after the message.
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="leading-snug font-medium">{centre.service_name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {place}
            {centre.distance_km != null && (
              <span> · {centre.distance_km} km away</span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      {centre.service_address && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {centre.service_address}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {hours && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            {hours}
          </span>
        )}
        {centre.places != null && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            {centre.places} approved places
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {centre.phone && (
          <a
            href={`tel:${centre.phone}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="size-3.5" />
            {centre.phone}
          </a>
        )}
        <a
          href={centre.maps_link}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MapPin className="size-3.5" />
          Directions
        </a>
      </div>
    </div>
  );
}

export function CentreResults({ centres }: { centres: Centre[] }) {
  if (!centres.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-2.5">
      {centres.map((c, i) => (
        <CentreCard key={`${c.service_name}-${i}`} centre={c} index={i} />
      ))}
    </div>
  );
}
