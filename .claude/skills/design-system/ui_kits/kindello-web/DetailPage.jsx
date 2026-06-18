// Centre detail page — the content-rich, SEO-critical profile.
const { Icon, Button, Tag, RatingBadge, StarRating, CentreCard } = window.KindelloDesignSystem_c65c52;

function Breadcrumb({ navigate }) {
  const crumbs = [["Home", "home"], ["Sydney", "results"], ["Surry Hills", "results"], ["Little Gum Tree Early Learning", null]];
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--muted-fg)", flexWrap: "wrap" }}>
      {crumbs.map(([label, to], i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: "var(--border)" }}>›</span>}
          {to ? <a href="#" onClick={(e) => { e.preventDefault(); navigate(to); }} style={{ color: "var(--teal-600)" }}>{label}</a>
              : <span style={{ color: "var(--fg)", fontWeight: 500 }}>{label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function Gallery() {
  const grads = [
    "linear-gradient(135deg, #2fb3b3, #1ca6a6 60%, #136d6d)",
    "linear-gradient(135deg, #ffc83d, #ff8166)",
    "linear-gradient(135deg, #57c5c5, #158888)",
    "linear-gradient(135deg, #ffd766, #f5b125)",
    "linear-gradient(135deg, #2fb3b3, #57c5c5)",
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10, height: 380 }}>
      <div style={{ gridRow: "1 / 3", borderRadius: "var(--radius-xl)", background: grads[0], position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "rgba(255,255,255,.5)" }}><Icon name="baby" size={72} strokeWidth={1.5} /></span>
      </div>
      {grads.slice(1).map((g, i) => (
        <div key={i} style={{ borderRadius: "var(--radius-lg)", background: g, position: "relative" }}>
          {i === 3 && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(31,32,28,.45)", color: "#fff", fontWeight: 600, fontSize: 16, borderRadius: "var(--radius-lg)" }}>+12 photos</span>}
        </div>
      ))}
    </div>
  );
}

function QuickFacts() {
  const facts = [
    { icon: "baby", label: "Age range", value: "0–5 years" },
    { icon: "clock", label: "Hours", value: "7:00am – 6:00pm" },
    { icon: "users", label: "Capacity", value: "66 places" },
    { icon: "sun", label: "Price guide", value: "$148 / day" },
    { icon: "shield-check", label: "NQS rating", value: "Exceeding" },
    { icon: "check", label: "Vacancy", value: "3 places now", accent: true },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {facts.map((f, i) => (
        <div key={i} style={{ padding: "20px 18px", borderLeft: i ? "1px solid var(--border)" : "none", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: f.accent ? "var(--coral-500)" : "var(--teal-600)" }}><Icon name={f.icon} size={20} /></span>
          <span style={{ fontSize: 12.5, color: "var(--muted-fg)" }}>{f.label}</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: f.accent ? "var(--coral-500)" : "var(--fg)" }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProgramRow({ title, ages, blurb }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--teal-50)", color: "var(--teal-600)", flex: "none" }}>
        <Icon name="baby" size={26} />
      </span>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h4 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>{title}</h4>
          <Tag tone="teal">{ages}</Tag>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)", marginTop: 6, maxWidth: 560 }}>{blurb}</p>
      </div>
    </div>
  );
}

function Review({ name, rating, when, text }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-xs)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "var(--radius-pill)", background: "var(--coral-100)", color: "var(--coral-600)", fontWeight: 600, fontSize: 15 }}>{name[0]}</span>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg)" }}>{name}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted-fg)" }}>{when}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><StarRating value={rating} showValue={false} size={14} /></div>
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text-body)" }}>{text}</p>
    </div>
  );
}

function DetailPage({ navigate }) {
  const features = ["Outdoor playground", "Organic meals included", "Qualified educators", "CCS approved", "Nappies & wipes supplied", "Incursions & excursions", "Daily updates app", "Sustainable garden program", "Air-conditioned rooms", "Sleep & rest rooms", "Allergy-aware kitchen", "Secure keypad entry"];
  const programs = [
    { title: "Nursery", ages: "0–2 yrs", blurb: "Primary-carer model with a calm, home-like room. Sleep and feeding follow each child's own rhythm." },
    { title: "Toddlers", ages: "2–3 yrs", blurb: "Sensory play, early language and gentle routines that build independence and confidence." },
    { title: "Preschool", ages: "3–5 yrs", blurb: "A Reggio-inspired program with a strong focus on outdoor learning and school readiness." },
  ];
  const reviews = [
    { name: "Priya S.", rating: 5, when: "2 weeks ago", text: "The educators genuinely know our daughter. The outdoor space is wonderful and the daily photos make drop-off so much easier." },
    { name: "Tom W.", rating: 5, when: "1 month ago", text: "Settled our son in beautifully. Communication is excellent and the food menu is a real standout." },
    { name: "Aisha M.", rating: 4, when: "2 months ago", text: "Lovely centre with caring staff. Waitlist was long but worth it for the nursery room." },
  ];
  const faqs = [
    { q: "What are the daily fees and what subsidy applies?", open: true, a: "Fees are $148/day before the Child Care Subsidy (CCS). Most families pay between $40–$95/day after CCS depending on income and activity. The centre is CCS-approved and can help you estimate your rate." },
    { q: "Is there a waitlist, and how do I join?" },
    { q: "What are the opening hours and public-holiday closures?" },
    { q: "Are meals and nappies included in the fee?" },
  ];
  const related = [
    { name: "Banksia House", suburb: "Carlton", distance: "0.8 km", rating: 4.9, reviews: 203, nqs: "Excellent", tags: ["Preschool"], seed: 2 },
    { name: "Jacaranda Cottage", suburb: "Redfern", distance: "1.6 km", rating: 4.7, reviews: 142, nqs: "Exceeding NQS", tags: ["Montessori"], seed: 0 },
    { name: "Gumnut Grove", suburb: "Darlington", distance: "1.1 km", rating: 4.8, reviews: 95, nqs: "Exceeding NQS", tags: ["Outdoor space"], seed: 1 },
  ];

  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 40px" };

  return (
    <div style={{ background: "var(--bg)", paddingBottom: 64 }}>
      <div style={{ ...wrap, paddingTop: 24 }}><Breadcrumb navigate={navigate} /></div>

      {/* Header block */}
      <div style={{ ...wrap, paddingTop: 22, paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>Little Gum Tree Early Learning</h1>
              <RatingBadge rating="Exceeding NQS" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: "var(--muted-fg)" }}><Icon name="map-pin" size={16} /> Surry Hills NSW 2010</span>
              <StarRating value={4.8} count={126} size={16} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <Tag tone="teal">Montessori</Tag><Tag>Outdoor space</Tag><Tag>Ages 0–5</Tag><Tag>Organic meals</Tag><Tag tone="coral">Places available</Tag>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flex: "none" }}>
            <Button variant="outline" iconLeft={<Icon name="heart" size={17} />}>Save</Button>
            <Button variant="accent" size="lg" iconLeft={<Icon name="sparkles" size={17} />}>Enquire</Button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div style={{ ...wrap, paddingBottom: 28 }}><Gallery /></div>

      {/* Quick facts */}
      <div style={{ ...wrap, paddingBottom: 40 }}><QuickFacts /></div>

      {/* Two-column body */}
      <div style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, alignItems: "start" }}>
        <div>
          {/* About */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 14 }}>About this centre</h2>
            <div style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: 14 }}>
              <p>Little Gum Tree is a nature-based early learning centre in the heart of Surry Hills, a short walk from Central Station. We care for up to 66 children from six weeks to five years across four light-filled rooms and a large native garden.</p>
              <p>Our program is Reggio-inspired and play-led: children explore real materials, spend time outdoors every day, and help tend our vegetable garden and worm farm. We hold an Exceeding National Quality Standard rating across all seven quality areas.</p>
              <p>Our educators are degree- and diploma-qualified, with low turnover and a primary-carer model so every child has a familiar, trusted adult. Meals are cooked fresh on site by our chef, with allergy-aware and culturally diverse menus.</p>
            </div>
          </section>

          {/* Programs */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 6 }}>Programs &amp; age groups</h2>
            {programs.map((p) => <ProgramRow key={p.title} {...p} />)}
          </section>

          {/* Features */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 16 }}>Features &amp; facilities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              {features.map((f) => (
                <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 15, color: "var(--text-body)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--teal-50)", color: "var(--teal-600)", flex: "none" }}><Icon name="check" size={14} /></span>
                  {f}
                </span>
              ))}
            </div>
          </section>

          {/* Location */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 16 }}>Location</h2>
            <div style={{ height: 280, borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border)", position: "relative", background: "linear-gradient(135deg, #e8f0ee, #dce8e6)" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "44px 44px", opacity: .5 }} />
              <span style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%)", color: "var(--coral-500)" }}><Icon name="map-pin" size={44} strokeWidth={2.25} /></span>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "var(--text-body)" }}><Icon name="map-pin" size={16} /> 24 Bourke Street, Surry Hills NSW 2010</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "var(--muted-fg)" }}><Icon name="users" size={16} /> 6 min walk from Central Station</span>
            </div>
          </section>

          {/* Reviews */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 16 }}>Reviews</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 24px", background: "var(--teal-tint)", borderRadius: "var(--radius-xl)", marginBottom: 18 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 42, fontWeight: 600, color: "var(--teal-700)", lineHeight: 1 }}>4.8</div>
                <div style={{ marginTop: 6 }}><StarRating value={4.8} showValue={false} size={15} /></div>
                <div style={{ fontSize: 13, color: "var(--muted-fg)", marginTop: 4 }}>126 reviews</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {[["5★", 78], ["4★", 32], ["3★", 11], ["2★", 3], ["1★", 2]].map(([l, pct]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted-fg)" }}>
                    <span style={{ width: 24 }}>{l}</span>
                    <span style={{ flex: 1, height: 7, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: pct + "%", background: "var(--sun-400)" }} /></span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.map((r, i) => <Review key={i} {...r} />)}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 16 }}>Frequently asked</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {faqs.map((f, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 22px", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--fg)" }}>{f.q}</span>
                    <span style={{ color: "var(--muted-fg)", transform: f.open ? "rotate(180deg)" : "none" }}><Icon name="chevron-down" size={18} /></span>
                  </div>
                  {f.open && f.a && <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text-body)", marginTop: 12 }}>{f.a}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky enquire sidebar */}
        <aside style={{ position: "sticky", top: 90 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-md)", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: "var(--fg)" }}>$148</span>
              <span style={{ fontSize: 14, color: "var(--muted-fg)" }}>/ day before CCS</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--coral-500)", marginBottom: 16 }}>
              <Icon name="check" size={15} /> 3 places available now
            </div>
            <Button variant="accent" full size="lg" style={{ marginBottom: 10 }}>Enquire now</Button>
            <Button variant="outline" full iconLeft={<Icon name="phone" size={16} />}>Call centre</Button>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--muted-fg)" }}><Icon name="clock" size={15} /> Mon–Fri 7:00am – 6:00pm</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--muted-fg)" }}><Icon name="shield-check" size={15} /> Verified · synced today</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      <div style={{ maxWidth: 1080, margin: "56px auto 0", padding: "0 40px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 18 }}>Nearby centres</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {related.map((c, i) => <div key={i} onClick={() => navigate("detail")}><CentreCard {...c} /></div>)}
        </div>
      </div>
    </div>
  );
}
window.DetailPage = DetailPage;
