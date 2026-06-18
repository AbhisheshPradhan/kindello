// Shared display formatters for the directory surfaces + chat cards.

export type DayHours = { start?: string; end?: string };
export type OperatingHours = Record<string, Record<string, DayHours>>;

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
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

/** "Mon–Fri 7:30am–6pm, Sat 8am–2pm" — collapses consecutive same-hours days. */
export function summariseHours(oh: OperatingHours | null | undefined): string | null {
  if (!oh) return null;
  const session = oh.annual ?? oh.school_terms_session_1 ?? oh.school_terms_session_2 ?? oh.holiday_care;
  if (!session) return null;

  const present = DAYS.filter((d) => session[d]?.start && session[d]?.end);
  if (!present.length) return null;

  const groups: { days: string[]; start: string; end: string }[] = [];
  for (const d of present) {
    const { start, end } = session[d] as { start: string; end: string };
    const last = groups[groups.length - 1];
    const lastDay = last?.days[last.days.length - 1];
    const consecutive = lastDay !== undefined && DAYS.indexOf(d) === DAYS.indexOf(lastDay) + 1;
    if (last && last.start === start && last.end === end && consecutive) last.days.push(d);
    else groups.push({ days: [d], start, end });
  }

  return groups
    .map((g) => {
      const span = g.days.length > 1 ? `${ABBR[g.days[0]]}–${ABBR[g.days[g.days.length - 1]]}` : ABBR[g.days[0]];
      return `${span} ${to12h(g.start)}–${to12h(g.end)}`;
    })
    .join(", ");
}

const RATING_LABEL: Record<string, string> = {
  Excellent: "Excellent",
  "Exceeding NQS": "Exceeding NQS",
  "Meeting NQS": "Meeting NQS",
  "Working Towards NQS": "Working towards NQS",
  "Significant Improvement Required": "Improvement required",
};

export function ratingLabel(rating: string | null | undefined): string {
  return (rating && RATING_LABEL[rating]) || "Not yet rated";
}
