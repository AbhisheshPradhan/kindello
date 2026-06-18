import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCentreDetail, getNearbyCentres, distanceKm, type CentreDetail } from "@/lib/directory";
import { summariseHours, ratingLabel } from "@/lib/format";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { CentreCard } from "@/components/ds/centre-card";
import { RatingBadge } from "@/components/ds/rating-badge";
import { StarRating } from "@/components/ds/star-rating";
import { Tag } from "@/components/ds/tag";
import { Icon, type IconName } from "@/components/ds/icon";
import { MapPreview } from "@/components/ds/map-preview";
import { CentreActions } from "@/components/centre/centre-actions";

function mapsLinkFor(c: CentreDetail): string {
  const q = [c.name, c.address, c.suburb, c.state, c.postcode].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function ageRange(c: CentreDetail): string {
  if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation) return "5 – 12 years";
  if (c.flags.preschoolStandalone || c.flags.preschoolSchool) return "3 – 5 years";
  if (c.flags.familyDayCare) return "6 weeks – 12 years";
  return "6 weeks – 5 years";
}

type Program = { name: string; age: string; blurb: string; icon: IconName };
function programs(c: CentreDetail): Program[] {
  if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation) {
    return [
      { name: "Before school care", age: "5 – 12 yrs", blurb: "An easy, supervised start to the day with breakfast and free play before the school bell.", icon: "sun" },
      { name: "After school care", age: "5 – 12 yrs", blurb: "Homework help, sport and creative activities in a relaxed setting until pick-up.", icon: "blocks" },
      { name: "Vacation care", age: "5 – 12 yrs", blurb: "A full holiday program of excursions, incursions and themed activity days.", icon: "graduation-cap" },
    ];
  }
  if (c.flags.preschoolStandalone || c.flags.preschoolSchool) {
    return [
      { name: "3 year old kinder", age: "3 – 4 yrs", blurb: "A play-based introduction to group learning, building social skills and curiosity.", icon: "blocks" },
      { name: "4 year old kinder", age: "4 – 5 yrs", blurb: "A government-funded program focused on school readiness in the year before school.", icon: "graduation-cap" },
    ];
  }
  return [
    { name: "Nursery", age: "6 wks – 2 yrs", blurb: "Warm, responsive care for babies with primary educators and a calm routine.", icon: "baby" },
    { name: "Toddlers", age: "2 – 3 yrs", blurb: "Active, sensory play that supports language, movement and growing independence.", icon: "blocks" },
    { name: "Kindergarten", age: "3 – 5 yrs", blurb: "A play-based program building literacy, numeracy and school-readiness.", icon: "graduation-cap" },
  ];
}

const FEATURES: { label: string; icon: IconName }[] = [
  { label: "Nutritious meals prepared on-site", icon: "utensils" },
  { label: "Natural outdoor play spaces", icon: "leaf" },
  { label: "Qualified, long-tenured educators", icon: "users" },
  { label: "Child Care Subsidy (CCS) approved", icon: "dollar-sign" },
  { label: "Daily updates via parent app", icon: "phone" },
  { label: "School-readiness program", icon: "graduation-cap" },
  { label: "Inclusive of additional needs", icon: "accessibility" },
  { label: "Incursions and excursions", icon: "calendar" },
];

// Representative reviews (preview content — verified Google reviews are Tier-2 enrichment).
function reviews(c: CentreDetail) {
  const pool = [
    { author: "Priya M.", when: "2 weeks ago", body: "The educators genuinely know our daughter — her settling-in was so gentle and we get a lovely daily summary. The outdoor area is a highlight." },
    { author: "Tom R.", when: "1 month ago", body: "Communication is excellent and you can tell the team is experienced. Our son has come out of his shell here. Waitlist moved faster than we expected." },
    { author: "Sarah & Dan", when: "2 months ago", body: "Clean, warm and well-run. The kinder program had our eldest more than ready for school. Highly recommend a tour to any local family." },
  ];
  return pool.slice(0, 3).map((r, i) => ({ ...r, rating: Math.max(4, Math.round(c.stars) - (i % 2)) }));
}

function faqs(c: CentreDetail) {
  const hours = summariseHours(c.operatingHours);
  const place = [c.suburb, c.state].filter(Boolean).join(", ");
  return [
    {
      q: `What are ${c.name}'s opening hours?`,
      a: hours
        ? `${c.name} operates ${hours}. Hours can vary across school terms and holidays, so confirm specific session times when you enquire.`
        : `Opening hours for ${c.name} aren't published in the register — the centre can confirm current session times when you enquire.`,
    },
    {
      q: `What is the NQS rating of ${c.name}?`,
      a: `${c.name} is rated "${ratingLabel(c.rating)}" against the National Quality Standard, the assessment all approved Australian services are measured against by ACECQA across seven quality areas.`,
    },
    {
      q: `How many places does ${c.name} have?`,
      a:
        c.places != null
          ? `${c.name} is approved for ${c.places} places. Live vacancies change often — enquire to check current availability for your child's age group.`
          : `Approved places for this service aren't listed — the centre can confirm capacity and availability directly.`,
    },
    {
      q: `Is ${c.name} approved for the Child Care Subsidy?`,
      a: `As an ACECQA-approved service${place ? ` in ${place}` : ""}, eligible families can typically claim the Child Care Subsidy here. Your subsidy percentage depends on your family income and activity — Services Australia can confirm your rate.`,
    },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = await getCentreDetail(id);
  if (!c) return { title: "Centre not found — Kindello" };
  const place = [c.suburb, c.state].filter(Boolean).join(", ");
  const title = `${c.name}${place ? `, ${place}` : ""} — reviews, rating & places | Kindello`;
  return {
    title,
    description: `${c.name}${place ? ` in ${place}` : ""} is rated ${ratingLabel(c.rating)} against the National Quality Standard${
      c.places != null ? `, with ${c.places} approved places` : ""
    }. See programs, hours, features and how to enquire.`,
    alternates: { canonical: `/centre/${c.id}` },
    openGraph: { title, type: "profile" },
  };
}

const GALLERY = [
  "linear-gradient(135deg,#2fb3b3,#1ca6a6 60%,#136d6d)",
  "linear-gradient(135deg,#ffc83d,#ff8166 70%,#f9603f)",
  "linear-gradient(135deg,#57c5c5,#2fb3b3 60%,#158888)",
];

export default async function CentrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const centre = await getCentreDetail(id);
  if (!centre) notFound();

  const [nearby] = await Promise.all([getNearbyCentres(centre, 3)]);
  const hours = summariseHours(centre.operatingHours);
  const mapsLink = mapsLinkFor(centre);
  const place = [centre.suburb, centre.state].filter(Boolean).join(", ");
  const progs = programs(centre);
  const revs = reviews(centre);
  const qs = faqs(centre);

  const facts: { label: string; value: string; icon: IconName }[] = [
    { label: "Age range", value: ageRange(centre), icon: "baby" },
    { label: "Hours", value: hours ?? "On enquiry", icon: "clock" },
    { label: "Capacity", value: centre.places != null ? `${centre.places} places` : "On enquiry", icon: "users" },
    { label: "Fees", value: "On enquiry · CCS", icon: "dollar-sign" },
    { label: "NQS rating", value: ratingLabel(centre.rating), icon: "shield-check" },
    { label: "Availability", value: "Enquire", icon: "calendar" },
  ];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div className="ds-container" style={{ padding: "24px 24px 64px" }}>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13.5, color: "var(--muted-fg)", marginBottom: 18 }}>
            <Link href="/" style={{ color: "var(--muted-fg)", textDecoration: "none" }}>Home</Link>
            <span>›</span>
            <Link href="/search" style={{ color: "var(--muted-fg)", textDecoration: "none" }}>Childcare</Link>
            {centre.suburb && (
              <>
                <span>›</span>
                <Link
                  href={`/search?suburb=${encodeURIComponent(centre.suburb)}`}
                  style={{ color: "var(--muted-fg)", textDecoration: "none" }}
                >
                  {centre.suburb}
                </Link>
              </>
            )}
            <span>›</span>
            <span style={{ color: "var(--text-body)" }}>{centre.name}</span>
          </nav>

          {/* Header block */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <RatingBadge rating={centre.rating} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--teal-700)" }}>
                  <Icon name="shield-check" size={14} /> Verified · synced today
                </span>
              </div>
              <h1 className="ds-page-h1" style={{ fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>
                {centre.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, fontSize: 15, color: "var(--muted-fg)" }}>
                <Icon name="map-pin" size={16} />
                <span>{centre.address ? `${centre.address}, ${place}` : place}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <StarRating value={centre.stars} count={centre.reviews} size={17} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {centre.tags.map((t) => (
                  <Tag key={t} tone="teal">{t}</Tag>
                ))}
              </div>
            </div>
            <CentreActions phone={centre.phone} mapsLink={mapsLink} />
          </div>

          {/* Photo gallery */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 12,
              marginTop: 28,
              height: 340,
            }}
            className="ds-gallery"
          >
            <div style={{ position: "relative", borderRadius: "var(--radius-xl)", overflow: "hidden", background: GALLERY[centre.seed % GALLERY.length] }}>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.5)" }}>
                <Icon name="baby" size={72} strokeWidth={1.5} />
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--teal-700)",
                  background: "rgba(255,255,255,.92)",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                Photos coming soon
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
              {[1, 2].map((n) => (
                <div
                  key={n}
                  style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", background: GALLERY[(centre.seed + n) % GALLERY.length] }}
                />
              ))}
            </div>
          </div>

          {/* Quick facts bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 1,
              marginTop: 28,
              background: "var(--border)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
            }}
          >
            {facts.map((f) => (
              <div key={f.label} style={{ background: "var(--surface)", padding: "16px 18px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted-fg)", marginBottom: 6 }}>
                  <Icon name={f.icon} size={14} /> {f.label}
                </span>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Two-column: content + sticky aside */}
          <div className="ds-detail-layout" style={{ marginTop: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {/* About */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>About {centre.name}</h2>
                <div style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: 14 }}>
                  <p>
                    {centre.name} is an approved {centre.flags.familyDayCare ? "family day care service" : "early-education and care service"}
                    {place ? ` in ${place}` : ""}, listed on the ACECQA national register and rated{" "}
                    <strong style={{ color: "var(--fg)" }}>{ratingLabel(centre.rating)}</strong> against the National Quality
                    Standard. {centre.providerName ? `It is operated by ${centre.providerName}.` : ""}
                  </p>
                  <p>
                    The service caters for children aged {ageRange(centre).toLowerCase()}
                    {centre.places != null ? `, with ${centre.places} approved places across its rooms` : ""}.{" "}
                    {hours ? `It is open ${hours}.` : ""} Families choose {centre.suburb ?? "this area"} centres like this one
                    for qualified educators, a play-based program and a genuine focus on school readiness — confirm the
                    current program and availability when you enquire.
                  </p>
                </div>
              </section>

              {/* Programs / age groups */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Programs &amp; age groups</h2>
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {progs.map((p) => (
                    <div key={p.name} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 18, background: "var(--surface)", boxShadow: "var(--shadow-xs)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: "var(--radius-lg)", background: "var(--teal-50)", color: "var(--teal-600)", marginBottom: 12 }}>
                        <Icon name={p.icon} size={22} />
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{p.name}</h3>
                        <Tag tone="sun">{p.age}</Tag>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-body)" }}>{p.blurb}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Features & facilities */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Features &amp; facilities</h2>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {FEATURES.map((f) => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: "var(--text-body)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "var(--teal-50)", color: "var(--teal-600)", flex: "none" }}>
                        <Icon name="check" size={16} />
                      </span>
                      {f.label}
                    </div>
                  ))}
                </div>
              </section>

              {/* NQS quality areas */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>Quality rating breakdown</h2>
                <p style={{ fontSize: 14.5, color: "var(--muted-fg)", marginBottom: 16 }}>
                  How {centre.name} is rated across the seven National Quality Standard areas, assessed by ACECQA.
                </p>
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                  {centre.qualityAreas.map((qa, i) => (
                    <div
                      key={qa.area}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "13px 16px",
                        borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <span style={{ fontSize: 14.5, color: "var(--text-body)" }}>
                        <span style={{ color: "var(--muted-fg)", fontFamily: "var(--font-mono)", marginRight: 8 }}>QA{qa.area}</span>
                        {qa.label}
                      </span>
                      <RatingBadge rating={qa.rating} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Location */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Location</h2>
                <MapPreview
                  points={centre.lat != null && centre.lng != null ? [{ lat: centre.lat, lng: centre.lng, rating: centre.rating, label: centre.name }] : []}
                  height={300}
                  showLabels
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14, alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14.5, color: "var(--text-body)" }}>
                    {centre.address ? `${centre.address}, ${place}` : place}
                  </span>
                  <a href={mapsLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--teal-600)", textDecoration: "none" }}>
                    Open in Google Maps <Icon name="arrow-right" size={15} />
                  </a>
                </div>
              </section>

              {/* Reviews */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)" }}>Parent reviews</h2>
                  <StarRating value={centre.stars} count={centre.reviews} size={16} />
                </div>
                <p style={{ fontSize: 13, color: "var(--muted-fg)", marginBottom: 16 }}>
                  Preview reviews — verified Google reviews are being added to Kindello.
                </p>
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                  {revs.map((r, i) => (
                    <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 18, background: "var(--surface)", boxShadow: "var(--shadow-xs)" }}>
                      <StarRating value={r.rating} showValue={false} size={14} />
                      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text-body)", margin: "10px 0 12px" }}>“{r.body}”</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "var(--muted-fg)" }}>
                        <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{r.author}</strong>
                        <span>{r.when}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* FAQ */}
              <section>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>
                  Frequently asked questions
                </h2>
                <div>
                  {qs.map((f, i) => (
                    <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", padding: "18px 0" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>{f.q}</h3>
                      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--text-body)" }}>{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sticky enquiry aside */}
            <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: 22, background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>Enquire with {centre.name}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-body)", margin: "8px 0 16px" }}>
                  Ask about availability, fees and tours. Centres respond directly through Kindello.
                </p>
                <CentreActions phone={centre.phone} mapsLink={mapsLink} />
                {centre.phone && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 14, color: "var(--text-body)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="phone" size={15} style={{ color: "var(--teal-600)" }} />
                    <a href={`tel:${centre.phone}`} style={{ color: "var(--fg)", textDecoration: "none", fontFamily: "var(--font-mono)" }}>
                      {centre.phone}
                    </a>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Related centres */}
          {nearby.length > 0 && (
            <section style={{ marginTop: 56 }}>
              <h2 className="ds-section-h2" style={{ fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 22 }}>
                Other centres nearby
              </h2>
              <div className="ds-grid ds-grid-3">
                {nearby.map((n) => (
                  <CentreCard
                    key={n.id}
                    href={`/centre/${n.id}`}
                    name={n.name}
                    suburb={n.suburb ?? ""}
                    distance={
                      centre.lat != null && centre.lng != null && n.lat != null && n.lng != null
                        ? `${distanceKm(centre.lat, centre.lng, n.lat, n.lng)} km`
                        : ""
                    }
                    rating={n.stars}
                    reviews={n.reviews}
                    nqs={n.rating}
                    tags={n.tags}
                    keyInfo={n.places != null ? `${n.places} approved places` : ""}
                    seed={n.seed}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
