// Kindello homepage — hero search + directory sections.
const { Icon, Button, PromptChip, CentreCard, CategoryTile, GuideCard, Tag } = window.KindelloDesignSystem_c65c52;

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>{title}</h2>
        {sub && <p style={{ fontSize: 15, color: "var(--muted-fg)", marginTop: 5 }}>{sub}</p>}
      </div>
      {action && <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14.5, fontWeight: 600, color: "var(--teal-600)" }}>{action} <Icon name="chevron-right" size={16} /></a>}
    </div>
  );
}

// Backspace typewriter — types a full example query, holds, deletes, rotates.
// Only animates the resting/empty hero; falls back to a static line under
// prefers-reduced-motion.
const HERO_QUERIES = [
  "Long day care for a 2 year old near Parramatta",
  "Montessori preschool in Surry Hills, outdoor space",
  "After school care close to Lakemba",
  "Top rated centres near Newcastle, places now",
];
function useTypewriter(words) {
  const reduce = React.useRef(
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  ).current;
  const [text, setText] = React.useState(words[0]);
  React.useEffect(() => {
    if (reduce) return;
    let i = 0, n = 0, deleting = false, timer;
    const tick = () => {
      const w = words[i % words.length];
      if (!deleting) {
        n++; setText(w.slice(0, n));
        if (n === w.length) { deleting = true; timer = setTimeout(tick, 1600); return; }
        timer = setTimeout(tick, 80);
      } else {
        n--; setText(w.slice(0, n));
        if (n === 0) { deleting = false; i++; timer = setTimeout(tick, 350); return; }
        timer = setTimeout(tick, 45);
      }
    };
    setText(""); timer = setTimeout(tick, 450);
    return () => clearTimeout(timer);
  }, []);
  return { text, reduce };
}

function Hero({ navigate }) {
  const chips = ["Long day care near me", "Open weekends", "Highly rated in Inner West", "Montessori in Surry Hills"];
  const { text: typed, reduce } = useTypewriter(HERO_QUERIES);
  return (
    <section style={{ background: "linear-gradient(180deg, var(--teal-tint), var(--bg) 78%)", padding: "76px 40px 64px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", fontSize: 13.5, fontWeight: 600, color: "var(--teal-700)", background: "var(--surface)", border: "1px solid var(--teal-200)", borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-xs)", marginBottom: 22 }}>
          <Icon name="shield-check" size={14} /> 18,229 approved centres · updated daily
        </span>
        <h1 style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--fg)" }}>
          Find the right childcare, faster.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--text-body)", marginTop: 18, maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
          Ask in plain English. Kindello searches every approved service in Australia by location, care type and quality rating.
        </p>

        {/* Hero chat box — the focal point */}
        <div
          style={{
            marginTop: 36, background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-lg)", padding: 18,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ color: "var(--teal-500)", marginTop: 2 }}><Icon name="sparkles" size={22} /></span>
            <p style={{ flex: 1, fontSize: 17, lineHeight: 1.5, color: "var(--muted-fg)", margin: 0, paddingTop: 1, minHeight: "1.5em" }}>
              {typed}
              {!reduce && <span className="hero-caret" />}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--muted-fg)" }}>
              <Icon name="map-pin" size={15} /> Anywhere in Australia
            </span>
            <button
              onClick={() => navigate("results")}
              aria-label="Search"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: "var(--radius-pill)", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "var(--shadow-teal)" }}
            >
              <Icon name="arrow-up" size={22} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", marginTop: 20 }}>
          {chips.map((c) => <PromptChip key={c} onClick={() => navigate("results")}>{c}</PromptChip>)}
        </div>
      </div>
    </section>
  );
}

function HomePage({ navigate }) {
  const featured = [
    { name: "Little Gum Tree Early Learning", suburb: "Surry Hills", distance: "1.2 km", rating: 4.8, reviews: 126, nqs: "Exceeding NQS", tags: ["Montessori", "Outdoor space"], keyInfo: "Places available", seed: 0 },
    { name: "Banksia House", suburb: "Carlton", distance: "0.8 km", rating: 4.9, reviews: 203, nqs: "Excellent", tags: ["Preschool", "Organic meals"], seed: 2 },
    { name: "Sunshine Cottage", suburb: "Newtown", distance: "2.1 km", rating: 4.6, reviews: 88, nqs: "Meeting NQS", tags: ["Long day care", "Ages 0–5"], keyInfo: "Waitlist only", seed: 1 },
    { name: "Little Wattle", suburb: "Fremantle", distance: "3.4 km", rating: 4.4, reviews: 51, nqs: "Exceeding NQS", tags: ["Family day care"], keyInfo: "Places available", seed: 3 },
  ];
  const cats = [
    { icon: "baby", label: "Long Day Care", count: 1240, tone: "teal" },
    { icon: "users", label: "Family Day Care", count: 410, tone: "coral" },
    { icon: "graduation-cap", label: "Preschool / Kindy", count: 680, tone: "sun" },
    { icon: "blocks", label: "Montessori", count: 142, tone: "teal" },
    { icon: "sun", label: "Occasional Care", count: 96, tone: "coral" },
  ];
  const areas = [
    { city: "Sydney", n: 4120 }, { city: "Melbourne", n: 3880 }, { city: "Brisbane", n: 2310 },
    { city: "Perth", n: 1490 }, { city: "Adelaide", n: 1020 }, { city: "Inner West", n: 540 },
    { city: "Gold Coast", n: 620 }, { city: "Canberra", n: 380 },
  ];
  const guides = [
    { category: "Choosing care", title: "How to read an NQS quality rating", readTime: "5 min read", seed: 0 },
    { category: "Costs", title: "Understanding the Child Care Subsidy", readTime: "6 min read", seed: 1 },
    { category: "Getting started", title: "Daycare waitlists: when to apply", readTime: "4 min read", seed: 2 },
  ];
  const faqs = [
    { q: "What does the NQS rating mean?", open: true, a: "The National Quality Standard rating is set by the regulator (ACECQA) across seven quality areas, from 'Significant Improvement Required' to 'Excellent'. Most centres sit at 'Meeting' or 'Exceeding'." },
    { q: "Is the centre information up to date?" },
    { q: "How do I know if a centre has places available?" },
    { q: "Does Kindello charge parents to use the directory?" },
  ];

  const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 40px" };

  return (
    <div>
      <Hero navigate={navigate} />

      {/* Featured listings */}
      <section style={{ ...wrap, padding: "64px 40px" }}>
        <SectionHead title="Popular near you" sub="Highly rated centres parents are enquiring about this week." action="See all" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {featured.map((c, i) => <div key={i} onClick={() => navigate("detail")}><CentreCard {...c} /></div>)}
        </div>
      </section>

      {/* Browse by type */}
      <section style={{ background: "var(--teal-tint)", padding: "64px 0" }}>
        <div style={wrap}>
          <SectionHead title="Browse by type" sub="Every care type, from long day care to occasional care." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {cats.map((c) => <div key={c.label} onClick={() => navigate("results")}><CategoryTile {...c} /></div>)}
          </div>
        </div>
      </section>

      {/* Browse by location */}
      <section style={{ ...wrap, padding: "64px 40px" }}>
        <SectionHead title="Explore by area" sub="Find approved centres in your city or suburb." action="All locations" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {areas.map((a) => (
            <button key={a.city} onClick={() => navigate("results")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", cursor: "pointer", boxShadow: "var(--shadow-xs)", textAlign: "left", transition: "all .15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--teal-300)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}>
              <span>
                <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{a.city}</span>
                <span style={{ fontSize: 13, color: "var(--muted-fg)" }}>{a.n.toLocaleString()} centres</span>
              </span>
              <span style={{ color: "var(--teal-500)" }}><Icon name="chevron-right" size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* Guides */}
      <section style={{ background: "var(--sun-tint)", padding: "64px 0" }}>
        <div style={wrap}>
          <SectionHead title="Guides for parents" sub="Plain-English help with ratings, subsidies and choosing care." action="All guides" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {guides.map((g, i) => <GuideCard key={i} {...g} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "72px 40px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", textAlign: "center", marginBottom: 30 }}>Common questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 22px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{f.q}</span>
                <span style={{ color: "var(--muted-fg)", transform: f.open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Icon name="chevron-down" size={18} /></span>
              </div>
              {f.open && f.a && <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)", marginTop: 12 }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
window.HomePage = HomePage;
window.SectionHead = SectionHead;
