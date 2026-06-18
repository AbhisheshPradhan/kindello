// Shared multi-column footer.
const { Icon } = window.KindelloDesignSystem_c65c52;

function Footer() {
  const cols = [
    { h: "Browse", links: ["Long day care", "Family day care", "Preschool", "Montessori", "Occasional care"] },
    { h: "Locations", links: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
    { h: "For parents", links: ["Guides", "How ratings work", "Child Care Subsidy", "FAQ"] },
    { h: "Company", links: ["About", "For centres", "Contact", "Privacy"] },
  ];
  return (
    <footer style={{ background: "var(--teal-tint)", color: "var(--text-body)", padding: "56px 40px 36px", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: 32 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img src="../../assets/brand/kindello-mark-clean.png" alt="" style={{ height: 30, width: "auto", display: "block" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-primary)" }}>Kindello</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 260, color: "var(--muted-fg)" }}>
            Every approved childcare service in Australia, in one place — with an AI finder that speaks plain English.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>{c.h}</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {c.links.map((l) => (
                <li key={l}><a href="#" style={{ fontSize: 14, color: "var(--text-body)", textDecoration: "none" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted-fg)" }}>
        <span>© 2026 Kindello. Quality ratings sourced from ACECQA.</span>
        <span>Made for Australian parents.</span>
      </div>
    </footer>
  );
}
window.Footer = Footer;
