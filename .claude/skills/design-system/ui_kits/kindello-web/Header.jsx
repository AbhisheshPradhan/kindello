// Shared site header — slim, logo left, nav right.
const { Icon, Button } = window.KindelloDesignSystem_c65c52;

function Header({ navigate, active }) {
  const nav = [
    { id: "home", label: "Browse" },
    { id: "home", label: "Locations" },
    { id: "home", label: "Guides" },
    { id: "home", label: "About" },
  ];
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 40px",
        background: "rgba(253,252,250,.85)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => navigate("home")}
        style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <img src="../../assets/brand/kindello-mark-clean.png" alt="" style={{ height: 32, width: "auto", display: "block" }} />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-primary)" }}>Kindello</span>
      </button>

      <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 18 }}>
        {nav.map((n, i) => (
          <button
            key={i}
            onClick={() => navigate(n.id)}
            style={{ padding: "8px 12px", fontSize: 14.5, fontWeight: 500, color: "var(--text-body)", background: "none", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />
      <Button variant="ghost" size="sm">Sign in</Button>
      <Button variant="primary" size="sm">List your centre</Button>
    </header>
  );
}
window.Header = Header;
