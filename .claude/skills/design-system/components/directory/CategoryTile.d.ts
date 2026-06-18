import * as React from "react";
import type { IconProps } from "../core/Icon";

export interface CategoryTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconProps["name"];
  label?: string;
  count?: number | null;
  tone?: "teal" | "coral" | "sun";
}

/** "Browse by type" tile — tinted icon square + label + centre count. */
export function CategoryTile(props: CategoryTileProps): React.JSX.Element;
