"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "./icon";
import { Tag } from "./tag";
import { RatingBadge } from "./rating-badge";
import { StarRating } from "./star-rating";

// Warm gradient stand-in for a centre photo (no real imagery yet — Tier-2 enrichment).
function PhotoPlaceholder({ seed = 0, featured = false }: { seed?: number; featured?: boolean }) {
  const grads = [
    "linear-gradient(135deg, #2fb3b3, #1ca6a6 60%, #136d6d)",
    "linear-gradient(135deg, #ffc83d, #ff8166 70%, #f9603f)",
    "linear-gradient(135deg, #57c5c5, #2fb3b3 60%, #158888)",
    "linear-gradient(135deg, #ffd766, #ffc83d 60%, #f5b125)",
  ];
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: featured ? "100%" : 168,
        minHeight: featured ? 280 : 168,
        background: grads[seed % grads.length],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 70% 20%, rgba(255,255,255,.25), transparent 55%)",
        }}
      />
      <span style={{ color: "rgba(255,255,255,.55)" }}>
        <Icon name="baby" size={featured ? 64 : 44} strokeWidth={1.5} />
      </span>
    </div>
  );
}

export type CentreCardProps = {
  name?: string;
  suburb?: string;
  distance?: string;
  rating?: number;
  reviews?: number;
  nqs?: string | null;
  tags?: string[];
  keyInfo?: string;
  verified?: boolean;
  seed?: number;
  featured?: boolean;
  href?: string;
  style?: CSSProperties;
};

/**
 * CentreCard — the core listing card. `featured` renders the enlarged
 * horizontal layout (photo left, detail right); default is the compact
 * grid card (photo on top). Pass `href` to make the whole card a link.
 */
export function CentreCard({
  name = "Little Gum Tree Early Learning",
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
  href,
  style,
}: CentreCardProps) {
  const [saved, setSaved] = useState(false);

  const card: CSSProperties = {
    display: "flex",
    flexDirection: featured ? "row" : "column",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
    transition: "box-shadow .18s ease, border-color .18s ease, transform .18s ease",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    ...style,
  };

  const Inner = (
    <>
      <div style={{ position: "relative", flex: featured ? "0 0 44%" : "none" }}>
        <PhotoPlaceholder seed={seed} featured={featured} />
        {verified && (
          <span
            style={{
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
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Icon name="shield-check" size={13} /> Verified
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          aria-label="Save"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
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
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill={saved ? "var(--coral-500)" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z" />
          </svg>
        </button>
      </div>

      <div
        style={{
          padding: featured ? "26px 28px" : "16px",
          display: "flex",
          flexDirection: "column",
          gap: featured ? 12 : 9,
          flex: 1,
          textAlign: featured ? "left" : "center",
          alignItems: featured ? "stretch" : "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: featured ? "space-between" : "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: featured ? 24 : 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--fg)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {name}
          </h3>
          <RatingBadge rating={nqs} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: featured ? "flex-start" : "center",
            gap: 6,
            fontSize: 14,
            color: "var(--muted-fg)",
          }}
        >
          <Icon name="map-pin" size={15} />
          <span>
            {suburb}
            {distance ? ` · ${distance}` : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: featured ? "flex-start" : "center" }}>
          <StarRating value={rating} count={reviews} size={featured ? 17 : 15} />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: featured ? "flex-start" : "center",
          }}
        >
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        {keyInfo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: featured ? "flex-start" : "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--coral-500)",
            }}
          >
            <Icon name="check" size={15} /> {keyInfo}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: featured ? "flex-start" : "center",
            gap: 6,
            marginTop: "auto",
            paddingTop: featured ? 6 : 4,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--teal-600)",
          }}
        >
          View details <Icon name="chevron-right" size={16} />
        </div>
      </div>
    </>
  );

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = "var(--teal-200)";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "none";
    },
  };

  if (href) {
    return (
      <a href={href} style={card} {...handlers}>
        {Inner}
      </a>
    );
  }
  return (
    <div style={card} {...handlers}>
      {Inner}
    </div>
  );
}
