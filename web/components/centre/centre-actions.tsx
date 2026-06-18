"use client";

import { useState } from "react";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";

/** Enquire (coral, high-intent) + Save toggle for the centre detail header. */
export function CentreActions({ phone, mapsLink }: { phone: string | null; mapsLink: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      <a href={phone ? `tel:${phone}` : mapsLink} target={phone ? undefined : "_blank"} rel="noopener noreferrer">
        <Button variant="accent" size="lg" iconLeft={<Icon name={phone ? "phone" : "map-pin"} size={18} />}>
          Enquire now
        </Button>
      </a>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setSaved((s) => !s)}
        iconLeft={
          <span style={{ color: saved ? "var(--coral-500)" : "inherit", display: "inline-flex" }}>
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
          </span>
        }
      >
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
