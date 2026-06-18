// Search results — featured enlarged card + compact grid.
const { Icon, Tag, CentreCard } = window.KindelloDesignSystem_c65c52;

function FilterBar() {
  const filters = ["Long day care", "Exceeding +", "Places available", "Outdoor space", "Within 5 km"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", fontSize: 14.5, color: "var(--text-body)", boxShadow: "var(--shadow-xs)" }}>
        <Icon name="search" size={16} />
        <span>Montessori daycare · Surry Hills</span>
      </div>
      <div style={{ width: 1, height: 24, background: "var(--border)" }} />
      {filters.map((f, i) => (
        <button key={f} style={{ padding: "7px 14px", fontSize: 13.5, fontWeight: 500, borderRadius: "var(--radius-pill)", cursor: "pointer",
          background: i === 0 ? "var(--teal-500)" : "var(--surface)", color: i === 0 ? "#fff" : "var(--text-body)",
          border: i === 0 ? "1px solid transparent" : "1px solid var(--border)" }}>
          {f}
        </button>
      ))}
    </div>
  );
}

function ResultsPage({ navigate }) {
  const grid = [
    { name: "Banksia House", suburb: "Carlton", distance: "0.8 km", rating: 4.9, reviews: 203, nqs: "Excellent", tags: ["Preschool", "Organic meals"], keyInfo: "Places available", seed: 2 },
    { name: "Sunshine Cottage", suburb: "Newtown", distance: "2.1 km", rating: 4.6, reviews: 88, nqs: "Meeting NQS", tags: ["Long day care", "Ages 0–5"], keyInfo: "Waitlist only", seed: 1 },
    { name: "Little Wattle", suburb: "Fremantle", distance: "3.4 km", rating: 4.4, reviews: 51, nqs: "Exceeding NQS", tags: ["Family day care"], keyInfo: "Places available", seed: 3 },
    { name: "Jacaranda Cottage", suburb: "Redfern", distance: "1.6 km", rating: 4.7, reviews: 142, nqs: "Exceeding NQS", tags: ["Montessori", "Bilingual"], seed: 0 },
    { name: "Possum Patch", suburb: "Erskineville", distance: "2.8 km", rating: 4.3, reviews: 37, nqs: "Meeting NQS", tags: ["Occasional care"], keyInfo: "Places available", seed: 2 },
    { name: "Gumnut Grove", suburb: "Darlington", distance: "1.1 km", rating: 4.8, reviews: 95, nqs: "Exceeding NQS", tags: ["Preschool", "Outdoor space"], seed: 1 },
  ];
  const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 40px" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 64 }}>
      <div style={{ background: "var(--teal-tint)", borderBottom: "1px solid var(--border)", padding: "28px 0" }}>
        <div style={wrap}><FilterBar /></div>
      </div>

      <div style={{ ...wrap, paddingTop: 36 }}>
        <p style={{ fontSize: 14.5, color: "var(--muted-fg)", marginBottom: 8 }}>
          <strong style={{ color: "var(--fg)" }}>34 centres</strong> near Surry Hills, sorted by best match
        </p>

        {/* Featured enlarged card */}
        <div onClick={() => navigate("detail")} style={{ marginBottom: 30 }}>
          <CentreCard featured seed={0}
            name="Little Gum Tree Early Learning" suburb="Surry Hills" distance="1.2 km"
            rating={4.8} reviews={126} nqs="Exceeding NQS"
            tags={["Montessori", "Outdoor space", "Ages 0–5"]} keyInfo="3 places available now" />
        </div>

        {/* Compact grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {grid.map((c, i) => <div key={i} onClick={() => navigate("detail")}><CentreCard {...c} /></div>)}
        </div>
      </div>
    </div>
  );
}
window.ResultsPage = ResultsPage;
