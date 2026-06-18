/* @ds-bundle: {"format":3,"namespace":"KindelloDesignSystem_c65c52","components":[{"name":"ChatComposer","sourcePath":"components/chat/ChatComposer.jsx"},{"name":"ContinueSearchCard","sourcePath":"components/chat/ContinueSearchCard.jsx"},{"name":"ConversationTabs","sourcePath":"components/chat/ConversationTabs.jsx"},{"name":"FollowUps","sourcePath":"components/chat/FollowUps.jsx"},{"name":"PlaceResultCard","sourcePath":"components/chat/PlaceResultCard.jsx"},{"name":"UserBubble","sourcePath":"components/chat/UserBubble.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"PromptChip","sourcePath":"components/core/PromptChip.jsx"},{"name":"RatingBadge","sourcePath":"components/core/RatingBadge.jsx"},{"name":"StarRating","sourcePath":"components/core/StarRating.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"CategoryTile","sourcePath":"components/directory/CategoryTile.jsx"},{"name":"CentreCard","sourcePath":"components/directory/CentreCard.jsx"},{"name":"GuideCard","sourcePath":"components/directory/GuideCard.jsx"}],"sourceHashes":{"components/chat/ChatComposer.jsx":"34adf0df8768","components/chat/ContinueSearchCard.jsx":"b5f8790f836f","components/chat/ConversationTabs.jsx":"98a34a4d82c4","components/chat/FollowUps.jsx":"ad2d17e66b4e","components/chat/PlaceResultCard.jsx":"59dbf56386a9","components/chat/UserBubble.jsx":"2f3b2d9f8b78","components/core/Button.jsx":"93d92aafc6c0","components/core/Icon.jsx":"84d4a869f333","components/core/PromptChip.jsx":"08e21e313709","components/core/RatingBadge.jsx":"adbc99fb5477","components/core/StarRating.jsx":"6d58eaeb227c","components/core/Tag.jsx":"fb7b853778ee","components/directory/CategoryTile.jsx":"ba3a9068f268","components/directory/CentreCard.jsx":"96141c1c2b8b","components/directory/GuideCard.jsx":"6fb36aff98ce","ui_kits/kindello-web/DetailPage.jsx":"127baa756366","ui_kits/kindello-web/Footer.jsx":"b9cf9869c933","ui_kits/kindello-web/Header.jsx":"57c9f719218e","ui_kits/kindello-web/HomePage.jsx":"58c3109db3c2","ui_kits/kindello-web/ResultsPage.jsx":"14992446ea7f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KindelloDesignSystem_c65c52 = window.KindelloDesignSystem_c65c52 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/chat/UserBubble.jsx
try { (() => {
/** UserBubble — a parent's message: right-aligned teal chat bubble. */
function UserBubble({
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "fit-content",
      maxWidth: "78%",
      marginLeft: "auto",
      background: "var(--color-primary)",
      color: "#fff",
      padding: "11px 16px",
      borderRadius: "18px 18px 4px 18px",
      fontFamily: "var(--font-sans)",
      fontSize: 14.5,
      lineHeight: 1.45,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { UserBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/UserBubble.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kindello Button — the primary action primitive.
 * Variants map to the app's shadcn button set, plus a coral `accent` for
 * high-intent CTAs (Enquire, Find care).
 */
function Button({
  variant = "primary",
  size = "md",
  full = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  children,
  ...props
}) {
  const sizes = {
    sm: {
      height: 34,
      padding: "0 14px",
      fontSize: 14,
      gap: 6
    },
    md: {
      height: 42,
      padding: "0 20px",
      fontSize: 15,
      gap: 8
    },
    lg: {
      height: 50,
      padding: "0 28px",
      fontSize: 16,
      gap: 8
    }
  };
  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "#fff",
      border: "1px solid transparent"
    },
    accent: {
      background: "var(--color-accent)",
      color: "#fff",
      border: "1px solid transparent"
    },
    secondary: {
      background: "var(--secondary)",
      color: "var(--fg)",
      border: "1px solid transparent"
    },
    outline: {
      background: "var(--surface)",
      color: "var(--fg)",
      border: "1px solid var(--border)"
    },
    ghost: {
      background: "transparent",
      color: "var(--fg)",
      border: "1px solid transparent"
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: full ? "100%" : "auto",
      fontFamily: "var(--font-sans)",
      fontSize: s.fontSize,
      fontWeight: 600,
      lineHeight: 1,
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "background .15s ease, opacity .15s ease, box-shadow .15s ease",
      boxShadow: variant === "accent" ? "var(--shadow-coral)" : variant === "primary" ? "var(--shadow-teal)" : "none",
      ...v,
      ...style
    },
    onMouseEnter: e => {
      if (variant === "primary") e.currentTarget.style.background = "var(--color-primary-hover)";else if (variant === "accent") e.currentTarget.style.background = "var(--color-accent-hover)";else if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "var(--secondary)";else if (variant === "secondary") e.currentTarget.style.opacity = "0.85";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = v.background;
      e.currentTarget.style.opacity = "1";
    }
  }, props), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Inline Lucide paths (the app's icon set) so components stay dependency-free.
const PATHS = {
  star: /*#__PURE__*/React.createElement("path", {
    d: "M11.5 2.8 14 8l5.7.8-4.1 4 1 5.7-5.1-2.7L6.3 18.5l1-5.7-4.1-4L8.9 8z"
  }),
  "map-pin": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 19v-2a4 4 0 0 0-3-3.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.1a4 4 0 0 1 0 7.8"
  })),
  phone: /*#__PURE__*/React.createElement("path", {
    d: "M14.5 3.5a16 16 0 0 0 6 6l-2 2a2 2 0 0 1-2 .5 13 13 0 0 1-5-3 13 13 0 0 1-3-5 2 2 0 0 1 .5-2l2-2"
  }),
  heart: /*#__PURE__*/React.createElement("path", {
    d: "M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z"
  }),
  "shield-check": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3 5 6v5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 12 2 2 4-4"
  })),
  sparkles: /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z"
  }),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5"
  })),
  "arrow-up": /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M6 11l6-6 6 6"
  }),
  "chevron-right": /*#__PURE__*/React.createElement("path", {
    d: "m9 6 6 6-6 6"
  }),
  "chevron-down": /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }),
  check: /*#__PURE__*/React.createElement("path", {
    d: "m5 12 4.5 4.5L19 7"
  }),
  baby: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6.3a9 9 0 0 1-8 5.7A9 9 0 0 1 3 6.3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 0 0 18 0"
  })),
  "graduation-cap": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 9 12 5 2 9l10 4 10-4Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 10.6V16a6 3 0 0 0 12 0v-5.4"
  })),
  blocks: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "8",
    height: "8",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "13",
    width: "8",
    height: "8",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 7h4a2 2 0 0 1 2 2v4"
  })),
  sun: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
  }))
};

/** Inline icon (Lucide path set). Stroke-based, inherits currentColor. */
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  style = {},
  ...props
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    "aria-hidden": "true"
  }, props), PATHS[name] || null);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/chat/ChatComposer.jsx
try { (() => {
/**
 * ChatComposer — the Perplexity-style input. Used full-size as the hero
 * search and compact as the pinned follow-up bar. Search-mode pill + model
 * selector + round teal send button.
 */
function ChatComposer({
  placeholder = "Ask a follow-up…",
  value = "",
  model = "Claude",
  onChange = () => {},
  onSubmit = () => {},
  size = "md",
  style = {}
}) {
  const big = size === "lg";
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit(value);
    },
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: big ? "var(--radius-2xl)" : "var(--radius-xl)",
      boxShadow: big ? "var(--shadow-lg)" : "var(--shadow-md)",
      padding: big ? 18 : "14px 16px 11px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, big && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--teal-500)",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: 22
  })), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: big ? 17 : 14.5,
      color: "var(--fg)",
      lineHeight: 1.5,
      padding: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: big ? 16 : 12
    }
  }, !big && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "1px solid var(--border)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-pill)",
      padding: "6px 12px",
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 14
  }), " Search ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, model, " ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    "aria-label": "Send",
    style: {
      width: big ? 46 : 32,
      height: big ? 46 : 32,
      borderRadius: "var(--radius-pill)",
      background: "var(--color-primary)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "var(--shadow-teal)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up",
    size: big ? 22 : 17
  }))));
}
Object.assign(__ds_scope, { ChatComposer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/ChatComposer.jsx", error: String((e && e.message) || e) }); }

// components/chat/ContinueSearchCard.jsx
try { (() => {
/**
 * ContinueSearchCard — a recent-search card for the homepage resting state's
 * "Pick up where you left off" section. Mini-map thumbnail (pins), recency,
 * the past query, a result summary, and a Continue affordance.
 */
function ContinueSearchCard({
  query = "Long day care for a 2 year old near Surry Hills",
  summary = "6 centres · 3 with places now",
  when = "2 days ago",
  pins = [[30, 50], [54, 40], [46, 66]],
  onResume = () => {},
  style = {}
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onResume,
    style: {
      display: "flex",
      flexDirection: "column",
      textAlign: "left",
      padding: 0,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      cursor: "pointer",
      transition: "box-shadow .18s ease, transform .18s ease, border-color .18s ease",
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = "var(--teal-200)";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "none";
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 116,
      position: "relative",
      background: "#eef2ee"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "54%",
      height: 2,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: "38%",
      width: 2,
      background: "#fff"
    }
  }), pins.map(([x, y], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      transform: "translate(-50%,-100%)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 12,
      height: 12,
      borderRadius: "var(--radius-pill)",
      background: "var(--teal-500)",
      border: "2px solid #fff",
      boxShadow: "0 1px 3px rgba(0,0,0,.3)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "15px 16px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13
  }), " ", when), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--fg)",
      lineHeight: 1.4
    }
  }, query), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, summary), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: "auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: 10,
      borderRadius: "var(--radius-md)",
      background: "var(--teal-50)",
      color: "var(--teal-700)",
      fontSize: 14,
      fontWeight: 600
    }
  }, "Continue ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 15
  }))));
}
Object.assign(__ds_scope, { ContinueSearchCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/ContinueSearchCard.jsx", error: String((e && e.message) || e) }); }

// components/chat/ConversationTabs.jsx
try { (() => {
/**
 * ConversationTabs — the single Answer ⇄ Places toggle that owns a whole
 * conversation, with a "New search" action on the right. Sticky-capable so
 * it pins under the site header as the thread scrolls.
 */
function ConversationTabs({
  active = "answer",
  placesCount = null,
  onSelect = () => {},
  onNewSearch = null,
  sticky = false,
  top = 59,
  style = {}
}) {
  const tab = (id, label, icon, count) => {
    const on = active === id;
    return /*#__PURE__*/React.createElement("button", {
      onClick: () => onSelect(id),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "14px 2px",
        marginBottom: -1,
        fontFamily: "var(--font-sans)",
        fontSize: 14.5,
        fontWeight: on ? 600 : 500,
        color: on ? "var(--fg)" : "var(--muted-fg)",
        background: "none",
        border: "none",
        borderBottom: `2px solid ${on ? "var(--teal-500)" : "transparent"}`,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: icon,
      size: 15
    }), label, count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        padding: "1px 6px",
        borderRadius: "var(--radius-pill)",
        background: on ? "var(--teal-50)" : "var(--secondary)",
        color: on ? "var(--teal-700)" : "var(--muted-fg)"
      }
    }, count));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 30,
      borderBottom: "1px solid var(--border)",
      ...(sticky ? {
        position: "sticky",
        top,
        zIndex: 15,
        background: "var(--surface-page)",
        paddingTop: 18
      } : {}),
      ...style
    }
  }, tab("answer", "Answer", "sparkles", null), tab("places", "Places", "map-pin", placesCount), onNewSearch && /*#__PURE__*/React.createElement("button", {
    onClick: onNewSearch,
    style: {
      marginLeft: "auto",
      marginBottom: 7,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-sans)",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-body)",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "7px 13px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 14
  }), " New search"));
}
Object.assign(__ds_scope, { ConversationTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/ConversationTabs.jsx", error: String((e && e.message) || e) }); }

// components/chat/FollowUps.jsx
try { (() => {
/**
 * FollowUps — Perplexity-style suggested next questions: a titled list of
 * tappable rows with a corner-return arrow and hairline dividers.
 */
function FollowUps({
  title = "Follow-ups",
  items = [],
  onSelect = () => {},
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      ...style
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      color: "var(--fg)",
      margin: "0 0 4px"
    }
  }, title), items.map((q, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => onSelect(q),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      padding: "14px 2px",
      borderTop: "1px solid var(--border)",
      background: "none",
      border: "none",
      borderTop: "1px solid var(--border)",
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: 15.5,
      color: "var(--text-body)"
    },
    onMouseEnter: e => e.currentTarget.style.color = "var(--teal-700)",
    onMouseLeave: e => e.currentTarget.style.color = "var(--text-body)"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted-fg)",
      flex: "none",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "17",
    height: "17",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 4v7a4 4 0 0 0 4 4h12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 10 5 5-5 5"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, q))));
}
Object.assign(__ds_scope, { FollowUps });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/FollowUps.jsx", error: String((e && e.message) || e) }); }

// components/chat/PlaceResultCard.jsx
try { (() => {
const GRADS = ["linear-gradient(135deg,#2fb3b3,#136d6d)", "linear-gradient(135deg,#57c5c5,#158888)", "linear-gradient(135deg,#ffc83d,#ff8166)", "linear-gradient(135deg,#ffd766,#f5b125)", "linear-gradient(135deg,#2fb3b3,#57c5c5)", "linear-gradient(135deg,#ff8166,#f9603f)"];

/**
 * PlaceResultCard — the larger result card used in the Places tab grid:
 * photo + Verified badge, name, rating, accent "places now" line, address
 * and phone, and a "More info" affordance. Photo is a gradient placeholder
 * (swap for real imagery in production).
 */
function PlaceResultCard({
  name = "Little Gum Tree Early Learning",
  suburb = "Surry Hills",
  distance = "1.2 km",
  rating = 4.8,
  reviews = 126,
  placesNow = "3 places now",
  phone = null,
  verified = true,
  seed = 0,
  onMore = () => {},
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-xs)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      position: "relative",
      background: GRADS[seed % GRADS.length]
    }
  }, verified && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 9,
      left: 9,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 9px",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--teal-700)",
      background: "rgba(255,255,255,.94)",
      borderRadius: "var(--radius-pill)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "shield-check",
    size: 11
  }), " Verified")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "13px 15px 15px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--fg)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-body)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--sun-400)"
    }
  }, "\u2605"), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--fg)",
      fontWeight: 600
    }
  }, rating.toFixed(1)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted-fg)"
    }
  }, "(", reviews, ")"), placesNow && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--border)"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--teal-600)",
      fontWeight: 600
    }
  }, placesNow))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)",
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 14
  }), " ", suburb, distance ? ` · ${distance}` : ""), phone && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)",
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "phone",
    size: 14
  }), " ", phone), /*#__PURE__*/React.createElement("button", {
    onClick: onMore,
    style: {
      marginTop: "auto",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      textAlign: "center",
      padding: 9,
      fontFamily: "var(--font-sans)",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-body)",
      background: "var(--surface)",
      cursor: "pointer"
    }
  }, "More info")));
}
Object.assign(__ds_scope, { PlaceResultCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chat/PlaceResultCard.jsx", error: String((e && e.message) || e) }); }

// components/core/PromptChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptChip — suggested-prompt pill for the hero search ("Long day care
 * near me", "Open weekends"). Rounded, hover lifts to teal tint.
 */
function PromptChip({
  style = {},
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 16px",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-body)",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      boxShadow: "var(--shadow-xs)",
      transition: "all .15s ease",
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = "var(--teal-50)";
      e.currentTarget.style.borderColor = "var(--teal-200)";
      e.currentTarget.style.color = "var(--teal-700)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = "var(--surface)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.color = "var(--text-body)";
    }
  }, props), children);
}
Object.assign(__ds_scope, { PromptChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PromptChip.jsx", error: String((e && e.message) || e) }); }

// components/core/RatingBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MAP = {
  "Excellent": {
    label: "Excellent",
    bg: "var(--teal-500)",
    fg: "#fff",
    solid: true
  },
  "Exceeding NQS": {
    label: "Exceeding",
    base: "var(--teal-500)"
  },
  "Meeting NQS": {
    label: "Meeting",
    base: "var(--rating-meeting)"
  },
  "Working Towards NQS": {
    label: "Working towards",
    base: "var(--rating-working)"
  },
  "Significant Improvement Required": {
    label: "Improvement required",
    base: "var(--rating-improve)"
  }
};

/**
 * RatingBadge — National Quality Standard rating pill, colour-coded
 * best→worst. Mirrors the app's ratingBadge() map.
 */
function RatingBadge({
  rating = null,
  style = {},
  ...props
}) {
  const m = MAP[rating];
  let css;
  if (!m) {
    css = {
      background: "var(--secondary)",
      color: "var(--muted-fg)",
      boxShadow: "inset 0 0 0 1px var(--border)"
    };
  } else if (m.solid) {
    css = {
      background: m.bg,
      color: m.fg
    };
  } else {
    css = {
      background: `color-mix(in srgb, ${m.base} 14%, transparent)`,
      color: m.base,
      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${m.base} 28%, transparent)`
    };
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 11px",
      fontFamily: "var(--font-sans)",
      fontSize: 12.5,
      fontWeight: 600,
      lineHeight: 1.3,
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...css,
      ...style
    }
  }, props), m ? m.label : "Not yet rated");
}
Object.assign(__ds_scope, { RatingBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/RatingBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/StarRating.jsx
try { (() => {
/**
 * StarRating — sunny-yellow filled stars + numeric score and optional
 * review count. Supports half-fill via clip.
 */
function StarRating({
  value = 0,
  count = null,
  size = 16,
  showValue = true,
  style = {}
}) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.max(0, Math.min(1, value - (i - 1)));
    stars.push(/*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        position: "relative",
        display: "inline-block",
        width: size,
        height: size,
        lineHeight: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--border)",
        position: "absolute",
        inset: 0
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "star",
      size: size,
      strokeWidth: 1.5
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--sun-400)",
        position: "absolute",
        inset: 0,
        width: `${fill * 100}%`,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "var(--sun-400)",
      stroke: "var(--sun-400)",
      strokeWidth: "1.5",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M11.5 2.8 14 8l5.7.8-4.1 4 1 5.7-5.1-2.7L6.3 18.5l1-5.7-4.1-4L8.9 8z"
    })))));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 2
    }
  }, stars), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size - 2,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, value.toFixed(1)), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted-fg)"
    }
  }, " \xB7 ", count, " reviews")));
}
Object.assign(__ds_scope, { StarRating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StarRating.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — a small rounded pill for centre attributes ("Montessori",
 * "Outdoor space", "Ages 0–5"). Tonal variants tint the pill.
 */
function Tag({
  tone = "neutral",
  style = {},
  children,
  ...props
}) {
  const tones = {
    neutral: {
      background: "var(--secondary)",
      color: "var(--text-body)"
    },
    teal: {
      background: "var(--teal-50)",
      color: "var(--teal-700)"
    },
    coral: {
      background: "var(--coral-100)",
      color: "var(--coral-600)"
    },
    sun: {
      background: "var(--sun-100)",
      color: "var(--sun-500)"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 11px",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.4,
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      ...t,
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/directory/CategoryTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CategoryTile — "Browse by type" tile. Icon in a soft tinted square,
 * label, and optional count. Hover raises + tints the border.
 */
function CategoryTile({
  icon = "baby",
  label = "Long Day Care",
  count = null,
  tone = "teal",
  style = {},
  ...props
}) {
  const tones = {
    teal: {
      fg: "var(--teal-600)",
      bg: "var(--teal-50)"
    },
    coral: {
      fg: "var(--coral-500)",
      bg: "var(--coral-100)"
    },
    sun: {
      fg: "var(--sun-500)",
      bg: "var(--sun-100)"
    }
  };
  const t = tones[tone] || tones.teal;
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 12,
      padding: "20px",
      textAlign: "left",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      cursor: "pointer",
      boxShadow: "var(--shadow-xs)",
      transition: "all .18s ease",
      width: "100%",
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = t.fg;
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-xs)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "none";
    }
  }, props), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 48,
      height: 48,
      borderRadius: "var(--radius-lg)",
      background: t.bg,
      color: t.fg
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, label), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, count, " centres"));
}
Object.assign(__ds_scope, { CategoryTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/directory/CategoryTile.jsx", error: String((e && e.message) || e) }); }

// components/directory/CentreCard.jsx
try { (() => {
// Warm gradient stand-in for a centre photo (no real imagery in the system).
function PhotoPlaceholder({
  seed = 0,
  featured = false
}) {
  const grads = ["linear-gradient(135deg, #2fb3b3, #1ca6a6 60%, #136d6d)", "linear-gradient(135deg, #ffc83d, #ff8166 70%, #f9603f)", "linear-gradient(135deg, #57c5c5, #2fb3b3 60%, #158888)", "linear-gradient(135deg, #ffd766, #ffc83d 60%, #f5b125)"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      height: featured ? "100%" : 168,
      minHeight: featured ? 280 : 168,
      background: grads[seed % grads.length],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 70% 20%, rgba(255,255,255,.25), transparent 55%)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,.55)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "baby",
    size: featured ? 64 : 44,
    strokeWidth: 1.5
  })));
}

/**
 * CentreCard — the core listing card. `featured` renders the enlarged
 * horizontal layout (photo left, detail right); default is the compact
 * grid card (photo on top).
 */
function CentreCard({
  name = "Little Gum Tree Early Learning",
  centreName = null,
  suburb = "Surry Hills",
  distance = "1.2 km",
  rating = 4.8,
  reviews = 126,
  nqs = "Exceeding NQS",
  tags = ["Montessori", "Outdoor space", "Ages 0–5"],
  keyInfo = "Places available",
  verified = true,
  seed = 0,
  featured = false,
  style = {}
}) {
  const [saved, setSaved] = React.useState(false);
  const displayName = centreName != null ? centreName : name;
  const HeartBtn = /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setSaved(s => !s);
    },
    "aria-label": "Save",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-pill)",
      background: "rgba(255,255,255,.9)",
      border: "none",
      cursor: "pointer",
      color: saved ? "var(--coral-500)" : "var(--muted-fg)",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: saved ? "var(--coral-500)" : "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z"
  })));
  const Badge = verified && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 10px",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--teal-700)",
      background: "rgba(255,255,255,.94)",
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "shield-check",
    size: 13
  }), " Verified");
  const card = {
    display: "flex",
    flexDirection: featured ? "row" : "column",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
    transition: "box-shadow .18s ease, border-color .18s ease, transform .18s ease",
    cursor: "pointer",
    ...style
  };
  return /*#__PURE__*/React.createElement("div", {
    style: card,
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = "var(--teal-200)";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "none";
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: featured ? "0 0 44%" : "none"
    }
  }, /*#__PURE__*/React.createElement(PhotoPlaceholder, {
    seed: seed,
    featured: featured
  }), Badge, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 12,
      right: 12
    }
  }, HeartBtn)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: featured ? "26px 28px" : "16px",
      display: "flex",
      flexDirection: "column",
      gap: featured ? 12 : 9,
      flex: 1,
      textAlign: featured ? "left" : "center",
      alignItems: featured ? "stretch" : "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: featured ? "space-between" : "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: featured ? 24 : 18,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      lineHeight: 1.2
    }
  }, displayName), /*#__PURE__*/React.createElement(__ds_scope.RatingBadge, {
    rating: nqs
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: featured ? "flex-start" : "center",
      gap: 6,
      fontSize: 14,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, suburb, distance ? ` · ${distance}` : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: featured ? "flex-start" : "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StarRating, {
    value: rating,
    count: reviews,
    size: featured ? 17 : 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: featured ? "flex-start" : "center"
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t))), keyInfo && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: featured ? "flex-start" : "center",
      gap: 6,
      fontSize: 14,
      fontWeight: 600,
      color: "var(--coral-500)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15
  }), " ", keyInfo), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: featured ? "flex-start" : "center",
      gap: 6,
      marginTop: "auto",
      paddingTop: featured ? 6 : 4,
      fontSize: 14,
      fontWeight: 600,
      color: "var(--teal-600)"
    }
  }, "View details ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16
  }))));
}
Object.assign(__ds_scope, { CentreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/directory/CentreCard.jsx", error: String((e && e.message) || e) }); }

// components/directory/GuideCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * GuideCard — parent-guide article card. Gradient thumbnail, category
 * eyebrow, title, read-time.
 */
function GuideCard({
  title = "How to read an NQS rating",
  category = "Choosing care",
  readTime = "5 min read",
  seed = 0,
  style = {},
  ...props
}) {
  const grads = ["linear-gradient(120deg, #57c5c5, #1ca6a6)", "linear-gradient(120deg, #ffd766, #ff8166)", "linear-gradient(120deg, #2fb3b3, #136d6d)"];
  return /*#__PURE__*/React.createElement("a", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      textDecoration: "none",
      boxShadow: "var(--shadow-sm)",
      transition: "all .18s ease",
      cursor: "pointer",
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      e.currentTarget.style.transform = "none";
    }
  }, props), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      background: grads[seed % grads.length]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--teal-600)"
    }
  }, category), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      color: "var(--fg)",
      lineHeight: 1.3
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, readTime)));
}
Object.assign(__ds_scope, { GuideCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/directory/GuideCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kindello-web/DetailPage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Centre detail page — the content-rich, SEO-critical profile.
const {
  Icon,
  Button,
  Tag,
  RatingBadge,
  StarRating,
  CentreCard
} = window.KindelloDesignSystem_c65c52;
function Breadcrumb({
  navigate
}) {
  const crumbs = [["Home", "home"], ["Sydney", "results"], ["Surry Hills", "results"], ["Little Gum Tree Early Learning", null]];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13.5,
      color: "var(--muted-fg)",
      flexWrap: "wrap"
    }
  }, crumbs.map(([label, to], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--border)"
    }
  }, "\u203A"), to ? /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      navigate(to);
    },
    style: {
      color: "var(--teal-600)"
    }
  }, label) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--fg)",
      fontWeight: 500
    }
  }, label))));
}
function Gallery() {
  const grads = ["linear-gradient(135deg, #2fb3b3, #1ca6a6 60%, #136d6d)", "linear-gradient(135deg, #ffc83d, #ff8166)", "linear-gradient(135deg, #57c5c5, #158888)", "linear-gradient(135deg, #ffd766, #f5b125)", "linear-gradient(135deg, #2fb3b3, #57c5c5)"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gap: 10,
      height: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridRow: "1 / 3",
      borderRadius: "var(--radius-xl)",
      background: grads[0],
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,.5)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "baby",
    size: 72,
    strokeWidth: 1.5
  }))), grads.slice(1).map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderRadius: "var(--radius-lg)",
      background: g,
      position: "relative"
    }
  }, i === 3 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(31,32,28,.45)",
      color: "#fff",
      fontWeight: 600,
      fontSize: 16,
      borderRadius: "var(--radius-lg)"
    }
  }, "+12 photos"))));
}
function QuickFacts() {
  const facts = [{
    icon: "baby",
    label: "Age range",
    value: "0–5 years"
  }, {
    icon: "clock",
    label: "Hours",
    value: "7:00am – 6:00pm"
  }, {
    icon: "users",
    label: "Capacity",
    value: "66 places"
  }, {
    icon: "sun",
    label: "Price guide",
    value: "$148 / day"
  }, {
    icon: "shield-check",
    label: "NQS rating",
    value: "Exceeding"
  }, {
    icon: "check",
    label: "Vacancy",
    value: "3 places now",
    accent: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 0,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden"
    }
  }, facts.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "20px 18px",
      borderLeft: i ? "1px solid var(--border)" : "none",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: f.accent ? "var(--coral-500)" : "var(--teal-600)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--muted-fg)"
    }
  }, f.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: f.accent ? "var(--coral-500)" : "var(--fg)"
    }
  }, f.value))));
}
function ProgramRow({
  title,
  ages,
  blurb
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      alignItems: "flex-start",
      padding: "20px 0",
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 52,
      height: 52,
      borderRadius: "var(--radius-lg)",
      background: "var(--teal-50)",
      color: "var(--teal-600)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "baby",
    size: 26
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, title), /*#__PURE__*/React.createElement(Tag, {
    tone: "teal"
  }, ages)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-body)",
      marginTop: 6,
      maxWidth: 560
    }
  }, blurb)));
}
function Review({
  name,
  rating,
  when,
  text
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: 20,
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: "var(--radius-pill)",
      background: "var(--coral-100)",
      color: "var(--coral-600)",
      fontWeight: 600,
      fontSize: 15
    }
  }, name[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--muted-fg)"
    }
  }, when)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(StarRating, {
    value: rating,
    showValue: false,
    size: 14
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: "var(--text-body)"
    }
  }, text));
}
function DetailPage({
  navigate
}) {
  const features = ["Outdoor playground", "Organic meals included", "Qualified educators", "CCS approved", "Nappies & wipes supplied", "Incursions & excursions", "Daily updates app", "Sustainable garden program", "Air-conditioned rooms", "Sleep & rest rooms", "Allergy-aware kitchen", "Secure keypad entry"];
  const programs = [{
    title: "Nursery",
    ages: "0–2 yrs",
    blurb: "Primary-carer model with a calm, home-like room. Sleep and feeding follow each child's own rhythm."
  }, {
    title: "Toddlers",
    ages: "2–3 yrs",
    blurb: "Sensory play, early language and gentle routines that build independence and confidence."
  }, {
    title: "Preschool",
    ages: "3–5 yrs",
    blurb: "A Reggio-inspired program with a strong focus on outdoor learning and school readiness."
  }];
  const reviews = [{
    name: "Priya S.",
    rating: 5,
    when: "2 weeks ago",
    text: "The educators genuinely know our daughter. The outdoor space is wonderful and the daily photos make drop-off so much easier."
  }, {
    name: "Tom W.",
    rating: 5,
    when: "1 month ago",
    text: "Settled our son in beautifully. Communication is excellent and the food menu is a real standout."
  }, {
    name: "Aisha M.",
    rating: 4,
    when: "2 months ago",
    text: "Lovely centre with caring staff. Waitlist was long but worth it for the nursery room."
  }];
  const faqs = [{
    q: "What are the daily fees and what subsidy applies?",
    open: true,
    a: "Fees are $148/day before the Child Care Subsidy (CCS). Most families pay between $40–$95/day after CCS depending on income and activity. The centre is CCS-approved and can help you estimate your rate."
  }, {
    q: "Is there a waitlist, and how do I join?"
  }, {
    q: "What are the opening hours and public-holiday closures?"
  }, {
    q: "Are meals and nappies included in the fee?"
  }];
  const related = [{
    name: "Banksia House",
    suburb: "Carlton",
    distance: "0.8 km",
    rating: 4.9,
    reviews: 203,
    nqs: "Excellent",
    tags: ["Preschool"],
    seed: 2
  }, {
    name: "Jacaranda Cottage",
    suburb: "Redfern",
    distance: "1.6 km",
    rating: 4.7,
    reviews: 142,
    nqs: "Exceeding NQS",
    tags: ["Montessori"],
    seed: 0
  }, {
    name: "Gumnut Grove",
    suburb: "Darlington",
    distance: "1.1 km",
    rating: 4.8,
    reviews: 95,
    nqs: "Exceeding NQS",
    tags: ["Outdoor space"],
    seed: 1
  }];
  const wrap = {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "0 40px"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bg)",
      paddingBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      paddingTop: 24
    }
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    navigate: navigate
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      paddingTop: 22,
      paddingBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 38,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)"
    }
  }, "Little Gum Tree Early Learning"), /*#__PURE__*/React.createElement(RatingBadge, {
    rating: "Exceeding NQS"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 15,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), " Surry Hills NSW 2010"), /*#__PURE__*/React.createElement(StarRating, {
    value: 4.8,
    count: 126,
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: "teal"
  }, "Montessori"), /*#__PURE__*/React.createElement(Tag, null, "Outdoor space"), /*#__PURE__*/React.createElement(Tag, null, "Ages 0\u20135"), /*#__PURE__*/React.createElement(Tag, null, "Organic meals"), /*#__PURE__*/React.createElement(Tag, {
    tone: "coral"
  }, "Places available"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "heart",
      size: 17
    })
  }, "Save"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 17
    })
  }, "Enquire")))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      paddingBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Gallery, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement(QuickFacts, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gap: 48,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 14
    }
  }, "About this centre"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      lineHeight: 1.7,
      color: "var(--text-body)",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("p", null, "Little Gum Tree is a nature-based early learning centre in the heart of Surry Hills, a short walk from Central Station. We care for up to 66 children from six weeks to five years across four light-filled rooms and a large native garden."), /*#__PURE__*/React.createElement("p", null, "Our program is Reggio-inspired and play-led: children explore real materials, spend time outdoors every day, and help tend our vegetable garden and worm farm. We hold an Exceeding National Quality Standard rating across all seven quality areas."), /*#__PURE__*/React.createElement("p", null, "Our educators are degree- and diploma-qualified, with low turnover and a primary-carer model so every child has a familiar, trusted adult. Meals are cooked fresh on site by our chef, with allergy-aware and culturally diverse menus."))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 6
    }
  }, "Programs & age groups"), programs.map(p => /*#__PURE__*/React.createElement(ProgramRow, _extends({
    key: p.title
  }, p)))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 16
    }
  }, "Features & facilities"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px 24px"
    }
  }, features.map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontSize: 15,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      borderRadius: "var(--radius-pill)",
      background: "var(--teal-50)",
      color: "var(--teal-600)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  })), f)))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 16
    }
  }, "Location"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 280,
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      border: "1px solid var(--border)",
      position: "relative",
      background: "linear-gradient(135deg, #e8f0ee, #dce8e6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
      opacity: .5
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "44%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      color: "var(--coral-500)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 44,
    strokeWidth: 2.25
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14.5,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), " 24 Bourke Street, Surry Hills NSW 2010"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 16
  }), " 6 min walk from Central Station"))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 16
    }
  }, "Reviews"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "20px 24px",
      background: "var(--teal-tint)",
      borderRadius: "var(--radius-xl)",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 42,
      fontWeight: 600,
      color: "var(--teal-700)",
      lineHeight: 1
    }
  }, "4.8"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(StarRating, {
    value: 4.8,
    showValue: false,
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)",
      marginTop: 4
    }
  }, "126 reviews")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, [["5★", 78], ["4★", 32], ["3★", 11], ["2★", 3], ["1★", 2]].map(([l, pct]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 7,
      background: "var(--surface)",
      borderRadius: 4,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: pct + "%",
      background: "var(--sun-400)"
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, reviews.map((r, i) => /*#__PURE__*/React.createElement(Review, _extends({
    key: i
  }, r))))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 16
    }
  }, "Frequently asked"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, faqs.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "18px 22px",
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, f.q), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted-fg)",
      transform: f.open ? "rotate(180deg)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 18
  }))), f.open && f.a && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: "var(--text-body)",
      marginTop: 12
    }
  }, f.a)))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "sticky",
      top: 90
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-md)",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 26,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, "$148"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--muted-fg)"
    }
  }, "/ day before CCS")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--coral-500)",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), " 3 places available now"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    full: true,
    size: "lg",
    style: {
      marginBottom: 10
    }
  }, "Enquire now"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    full: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 16
    })
  }, "Call centre"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 15
  }), " Mon\u2013Fri 7:00am \u2013 6:00pm"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 15
  }), " Verified \xB7 synced today"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1080,
      margin: "56px auto 0",
      padding: "0 40px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      marginBottom: 18
    }
  }, "Nearby centres"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 18
    }
  }, related.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => navigate("detail")
  }, /*#__PURE__*/React.createElement(CentreCard, c))))));
}
window.DetailPage = DetailPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kindello-web/DetailPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kindello-web/Footer.jsx
try { (() => {
// Shared multi-column footer.
const {
  Icon
} = window.KindelloDesignSystem_c65c52;
function Footer() {
  const cols = [{
    h: "Browse",
    links: ["Long day care", "Family day care", "Preschool", "Montessori", "Occasional care"]
  }, {
    h: "Locations",
    links: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"]
  }, {
    h: "For parents",
    links: ["Guides", "How ratings work", "Child Care Subsidy", "FAQ"]
  }, {
    h: "Company",
    links: ["About", "For centres", "Contact", "Privacy"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--teal-tint)",
      color: "var(--text-body)",
      padding: "56px 40px 36px",
      borderTop: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1.4fr repeat(4, 1fr)",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/brand/kindello-mark-clean.png",
    alt: "",
    style: {
      height: 30,
      width: "auto",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 21,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--color-primary)"
    }
  }, "Kindello")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      maxWidth: 260,
      color: "var(--muted-fg)"
    }
  }, "Every approved childcare service in Australia, in one place \u2014 with an AI finder that speaks plain English.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--fg)",
      textTransform: "uppercase",
      letterSpacing: ".05em",
      marginBottom: 14
    }
  }, c.h), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, c.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      color: "var(--text-body)",
      textDecoration: "none"
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "40px auto 0",
      paddingTop: 24,
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Kindello. Quality ratings sourced from ACECQA."), /*#__PURE__*/React.createElement("span", null, "Made for Australian parents.")));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kindello-web/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kindello-web/Header.jsx
try { (() => {
// Shared site header — slim, logo left, nav right.
const {
  Icon,
  Button
} = window.KindelloDesignSystem_c65c52;
function Header({
  navigate,
  active
}) {
  const nav = [{
    id: "home",
    label: "Browse"
  }, {
    id: "home",
    label: "Locations"
  }, {
    id: "home",
    label: "Guides"
  }, {
    id: "home",
    label: "About"
  }];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "14px 40px",
      background: "rgba(253,252,250,.85)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("home"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/brand/kindello-mark-clean.png",
    alt: "",
    style: {
      height: 32,
      width: "auto",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 21,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--color-primary)"
    }
  }, "Kindello")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginLeft: 18
    }
  }, nav.map((n, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate(n.id),
    style: {
      padding: "8px 12px",
      fontSize: 14.5,
      fontWeight: 500,
      color: "var(--text-body)",
      background: "none",
      border: "none",
      borderRadius: "var(--radius-md)",
      cursor: "pointer"
    },
    onMouseEnter: e => e.currentTarget.style.background = "var(--secondary)",
    onMouseLeave: e => e.currentTarget.style.background = "none"
  }, n.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "List your centre"));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kindello-web/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kindello-web/HomePage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Kindello homepage — hero search + directory sections.
const {
  Icon,
  Button,
  PromptChip,
  CentreCard,
  CategoryTile,
  GuideCard,
  Tag
} = window.KindelloDesignSystem_c65c52;
function SectionHead({
  title,
  sub,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)"
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: "var(--muted-fg)",
      marginTop: 5
    }
  }, sub)), action && /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--teal-600)"
    }
  }, action, " ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })));
}

// Backspace typewriter — types a full example query, holds, deletes, rotates.
// Only animates the resting/empty hero; falls back to a static line under
// prefers-reduced-motion.
const HERO_QUERIES = ["Long day care for a 2 year old near Parramatta", "Montessori preschool in Surry Hills, outdoor space", "After school care close to Lakemba", "Top rated centres near Newcastle, places now"];
function useTypewriter(words) {
  const reduce = React.useRef(typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false).current;
  const [text, setText] = React.useState(words[0]);
  React.useEffect(() => {
    if (reduce) return;
    let i = 0,
      n = 0,
      deleting = false,
      timer;
    const tick = () => {
      const w = words[i % words.length];
      if (!deleting) {
        n++;
        setText(w.slice(0, n));
        if (n === w.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
        timer = setTimeout(tick, 80);
      } else {
        n--;
        setText(w.slice(0, n));
        if (n === 0) {
          deleting = false;
          i++;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 45);
      }
    };
    setText("");
    timer = setTimeout(tick, 450);
    return () => clearTimeout(timer);
  }, []);
  return {
    text,
    reduce
  };
}
function Hero({
  navigate
}) {
  const chips = ["Long day care near me", "Open weekends", "Highly rated in Inner West", "Montessori in Surry Hills"];
  const {
    text: typed,
    reduce
  } = useTypewriter(HERO_QUERIES);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "linear-gradient(180deg, var(--teal-tint), var(--bg) 78%)",
      padding: "76px 40px 64px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "6px 14px",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--teal-700)",
      background: "var(--surface)",
      border: "1px solid var(--teal-200)",
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--shadow-xs)",
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 14
  }), " 18,229 approved centres \xB7 updated daily"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 52,
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.05,
      color: "var(--fg)"
    }
  }, "Find the right childcare, faster."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      lineHeight: 1.5,
      color: "var(--text-body)",
      marginTop: 18,
      maxWidth: 580,
      marginLeft: "auto",
      marginRight: "auto"
    }
  }, "Ask in plain English. Kindello searches every approved service in Australia by location, care type and quality rating."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-2xl)",
      boxShadow: "var(--shadow-lg)",
      padding: 18,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--teal-500)",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 22
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      flex: 1,
      fontSize: 17,
      lineHeight: 1.5,
      color: "var(--muted-fg)",
      margin: 0,
      paddingTop: 1,
      minHeight: "1.5em"
    }
  }, typed, !reduce && /*#__PURE__*/React.createElement("span", {
    className: "hero-caret"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 15
  }), " Anywhere in Australia"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("results"),
    "aria-label": "Search",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 46,
      height: 46,
      borderRadius: "var(--radius-pill)",
      background: "var(--color-primary)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      boxShadow: "var(--shadow-teal)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up",
    size: 22
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 9,
      justifyContent: "center",
      marginTop: 20
    }
  }, chips.map(c => /*#__PURE__*/React.createElement(PromptChip, {
    key: c,
    onClick: () => navigate("results")
  }, c)))));
}
function HomePage({
  navigate
}) {
  const featured = [{
    name: "Little Gum Tree Early Learning",
    suburb: "Surry Hills",
    distance: "1.2 km",
    rating: 4.8,
    reviews: 126,
    nqs: "Exceeding NQS",
    tags: ["Montessori", "Outdoor space"],
    keyInfo: "Places available",
    seed: 0
  }, {
    name: "Banksia House",
    suburb: "Carlton",
    distance: "0.8 km",
    rating: 4.9,
    reviews: 203,
    nqs: "Excellent",
    tags: ["Preschool", "Organic meals"],
    seed: 2
  }, {
    name: "Sunshine Cottage",
    suburb: "Newtown",
    distance: "2.1 km",
    rating: 4.6,
    reviews: 88,
    nqs: "Meeting NQS",
    tags: ["Long day care", "Ages 0–5"],
    keyInfo: "Waitlist only",
    seed: 1
  }, {
    name: "Little Wattle",
    suburb: "Fremantle",
    distance: "3.4 km",
    rating: 4.4,
    reviews: 51,
    nqs: "Exceeding NQS",
    tags: ["Family day care"],
    keyInfo: "Places available",
    seed: 3
  }];
  const cats = [{
    icon: "baby",
    label: "Long Day Care",
    count: 1240,
    tone: "teal"
  }, {
    icon: "users",
    label: "Family Day Care",
    count: 410,
    tone: "coral"
  }, {
    icon: "graduation-cap",
    label: "Preschool / Kindy",
    count: 680,
    tone: "sun"
  }, {
    icon: "blocks",
    label: "Montessori",
    count: 142,
    tone: "teal"
  }, {
    icon: "sun",
    label: "Occasional Care",
    count: 96,
    tone: "coral"
  }];
  const areas = [{
    city: "Sydney",
    n: 4120
  }, {
    city: "Melbourne",
    n: 3880
  }, {
    city: "Brisbane",
    n: 2310
  }, {
    city: "Perth",
    n: 1490
  }, {
    city: "Adelaide",
    n: 1020
  }, {
    city: "Inner West",
    n: 540
  }, {
    city: "Gold Coast",
    n: 620
  }, {
    city: "Canberra",
    n: 380
  }];
  const guides = [{
    category: "Choosing care",
    title: "How to read an NQS quality rating",
    readTime: "5 min read",
    seed: 0
  }, {
    category: "Costs",
    title: "Understanding the Child Care Subsidy",
    readTime: "6 min read",
    seed: 1
  }, {
    category: "Getting started",
    title: "Daycare waitlists: when to apply",
    readTime: "4 min read",
    seed: 2
  }];
  const faqs = [{
    q: "What does the NQS rating mean?",
    open: true,
    a: "The National Quality Standard rating is set by the regulator (ACECQA) across seven quality areas, from 'Significant Improvement Required' to 'Excellent'. Most centres sit at 'Meeting' or 'Exceeding'."
  }, {
    q: "Is the centre information up to date?"
  }, {
    q: "How do I know if a centre has places available?"
  }, {
    q: "Does Kindello charge parents to use the directory?"
  }];
  const wrap = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 40px"
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Hero, {
    navigate: navigate
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      ...wrap,
      padding: "64px 40px"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Popular near you",
    sub: "Highly rated centres parents are enquiring about this week.",
    action: "See all"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 18
    }
  }, featured.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => navigate("detail")
  }, /*#__PURE__*/React.createElement(CentreCard, c))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--teal-tint)",
      padding: "64px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Browse by type",
    sub: "Every care type, from long day care to occasional care."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 16
    }
  }, cats.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.label,
    onClick: () => navigate("results")
  }, /*#__PURE__*/React.createElement(CategoryTile, c)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...wrap,
      padding: "64px 40px"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Explore by area",
    sub: "Find approved centres in your city or suburb.",
    action: "All locations"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16
    }
  }, areas.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.city,
    onClick: () => navigate("results"),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "18px 20px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      cursor: "pointer",
      boxShadow: "var(--shadow-xs)",
      textAlign: "left",
      transition: "all .15s ease"
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = "var(--teal-300)";
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "var(--shadow-xs)";
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 16,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, a.city), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, a.n.toLocaleString(), " centres")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--teal-500)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18
  })))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--sun-tint)",
      padding: "64px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Guides for parents",
    sub: "Plain-English help with ratings, subsidies and choosing care.",
    action: "All guides"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 20
    }
  }, guides.map((g, i) => /*#__PURE__*/React.createElement(GuideCard, _extends({
    key: i
  }, g)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      padding: "72px 40px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "var(--fg)",
      textAlign: "center",
      marginBottom: 30
    }
  }, "Common questions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, faqs.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "18px 22px",
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--fg)"
    }
  }, f.q), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted-fg)",
      transform: f.open ? "rotate(180deg)" : "none",
      transition: "transform .2s"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 18
  }))), f.open && f.a && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-body)",
      marginTop: 12
    }
  }, f.a))))));
}
window.HomePage = HomePage;
window.SectionHead = SectionHead;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kindello-web/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kindello-web/ResultsPage.jsx
try { (() => {
// Search results — featured enlarged card + compact grid.
const {
  Icon,
  Tag,
  CentreCard
} = window.KindelloDesignSystem_c65c52;
function FilterBar() {
  const filters = ["Long day care", "Exceeding +", "Places available", "Outdoor space", "Within 5 km"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 16px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-pill)",
      fontSize: 14.5,
      color: "var(--text-body)",
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "Montessori daycare \xB7 Surry Hills")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 24,
      background: "var(--border)"
    }
  }), filters.map((f, i) => /*#__PURE__*/React.createElement("button", {
    key: f,
    style: {
      padding: "7px 14px",
      fontSize: 13.5,
      fontWeight: 500,
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      background: i === 0 ? "var(--teal-500)" : "var(--surface)",
      color: i === 0 ? "#fff" : "var(--text-body)",
      border: i === 0 ? "1px solid transparent" : "1px solid var(--border)"
    }
  }, f)));
}
function ResultsPage({
  navigate
}) {
  const grid = [{
    name: "Banksia House",
    suburb: "Carlton",
    distance: "0.8 km",
    rating: 4.9,
    reviews: 203,
    nqs: "Excellent",
    tags: ["Preschool", "Organic meals"],
    keyInfo: "Places available",
    seed: 2
  }, {
    name: "Sunshine Cottage",
    suburb: "Newtown",
    distance: "2.1 km",
    rating: 4.6,
    reviews: 88,
    nqs: "Meeting NQS",
    tags: ["Long day care", "Ages 0–5"],
    keyInfo: "Waitlist only",
    seed: 1
  }, {
    name: "Little Wattle",
    suburb: "Fremantle",
    distance: "3.4 km",
    rating: 4.4,
    reviews: 51,
    nqs: "Exceeding NQS",
    tags: ["Family day care"],
    keyInfo: "Places available",
    seed: 3
  }, {
    name: "Jacaranda Cottage",
    suburb: "Redfern",
    distance: "1.6 km",
    rating: 4.7,
    reviews: 142,
    nqs: "Exceeding NQS",
    tags: ["Montessori", "Bilingual"],
    seed: 0
  }, {
    name: "Possum Patch",
    suburb: "Erskineville",
    distance: "2.8 km",
    rating: 4.3,
    reviews: 37,
    nqs: "Meeting NQS",
    tags: ["Occasional care"],
    keyInfo: "Places available",
    seed: 2
  }, {
    name: "Gumnut Grove",
    suburb: "Darlington",
    distance: "1.1 km",
    rating: 4.8,
    reviews: 95,
    nqs: "Exceeding NQS",
    tags: ["Preschool", "Outdoor space"],
    seed: 1
  }];
  const wrap = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 40px"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bg)",
      minHeight: "100vh",
      paddingBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--teal-tint)",
      borderBottom: "1px solid var(--border)",
      padding: "28px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(FilterBar, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      paddingTop: 36
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      color: "var(--muted-fg)",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--fg)"
    }
  }, "34 centres"), " near Surry Hills, sorted by best match"), /*#__PURE__*/React.createElement("div", {
    onClick: () => navigate("detail"),
    style: {
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement(CentreCard, {
    featured: true,
    seed: 0,
    name: "Little Gum Tree Early Learning",
    suburb: "Surry Hills",
    distance: "1.2 km",
    rating: 4.8,
    reviews: 126,
    nqs: "Exceeding NQS",
    tags: ["Montessori", "Outdoor space", "Ages 0–5"],
    keyInfo: "3 places available now"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 18
    }
  }, grid.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => navigate("detail")
  }, /*#__PURE__*/React.createElement(CentreCard, c))))));
}
window.ResultsPage = ResultsPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kindello-web/ResultsPage.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ChatComposer = __ds_scope.ChatComposer;

__ds_ns.ContinueSearchCard = __ds_scope.ContinueSearchCard;

__ds_ns.ConversationTabs = __ds_scope.ConversationTabs;

__ds_ns.FollowUps = __ds_scope.FollowUps;

__ds_ns.PlaceResultCard = __ds_scope.PlaceResultCard;

__ds_ns.UserBubble = __ds_scope.UserBubble;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.PromptChip = __ds_scope.PromptChip;

__ds_ns.RatingBadge = __ds_scope.RatingBadge;

__ds_ns.StarRating = __ds_scope.StarRating;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.CategoryTile = __ds_scope.CategoryTile;

__ds_ns.CentreCard = __ds_scope.CentreCard;

__ds_ns.GuideCard = __ds_scope.GuideCard;

})();
