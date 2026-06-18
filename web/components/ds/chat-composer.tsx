"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./icon";

export type ComposerModel = { id: string; label: string };

/**
 * ChatComposer — the Perplexity-style search input. `lg` is the hero focal
 * point (sparkles icon, big rounding, teal-glow send); `md` is the slim bar
 * pinned under the Answer thread. Controlled. The model selector is a real
 * native <select> when `models` is supplied.
 */
export function ChatComposer({
	placeholder = "Ask a follow-up…",
	value,
	onChange,
	onSubmit,
	size = "md",
	disabled = false,
	autoFocus = false,
	models,
	model,
	onModelChange,
	placeholderOverlay,
	location,
	style,
}: {
	placeholder?: string;
	value: string;
	onChange: (v: string) => void;
	onSubmit: (v: string) => void;
	size?: "md" | "lg";
	disabled?: boolean;
	autoFocus?: boolean;
	models?: ComposerModel[];
	model?: string;
	onModelChange?: (id: string) => void;
	/** Optional node rendered behind the input (e.g. a typewriter placeholder). */
	placeholderOverlay?: React.ReactNode;
	/** Resolved search location label; defaults to "Anywhere in Australia". */
	location?: string;
	style?: CSSProperties;
}) {
	const big = size === "lg";
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [focused, setFocused] = useState(false);

	// Auto-grow: reset to content height on every value change so the box
	// expands as text wraps, capped at 300px (then it scrolls).
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);
	const selectedLabel =
		models?.find((m) => m.id === model)?.label ?? "Claude";
	const canSend = !disabled && value.trim().length > 0;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (canSend) onSubmit(value);
			}}
			style={{
				background: "var(--surface)",
				border: `1px solid ${focused ? "var(--teal-400)" : "var(--border)"}`,
				borderRadius: big ? "var(--radius-2xl)" : "var(--radius-xl)",
				// Teal ring + glow when the input is active.
				boxShadow: focused
					? `${big ? "var(--shadow-lg)" : "var(--shadow-md)"}, 0 0 0 3px color-mix(in srgb, var(--teal-500) 16%, transparent)`
					: big
						? "var(--shadow-lg)"
						: "var(--shadow-md)",
				padding: big ? 18 : "14px 16px 11px",
				transition: "border-color .15s ease, box-shadow .15s ease",
				...style,
			}}
		>
			<div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
				{big && (
					<span
						className="hidden sm:inline-block"
						style={{
							color: "var(--teal-500)",
							marginTop: 2,
							flex: "none",
						}}
					>
						<Icon
							name="sparkles"
							size={22}
						/>
					</span>
				)}
				<div style={{ flex: 1, position: "relative", minWidth: 0 }}>
					{placeholderOverlay && value === "" && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								alignItems: "center",
								pointerEvents: "none",
								fontFamily: "var(--font-sans)",
								fontSize: big ? 17 : 14.5,
								color: "var(--muted-fg)",
								lineHeight: 1.5,
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							{placeholderOverlay}
						</div>
					)}
					<textarea
						ref={inputRef}
						rows={1}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						onKeyDown={(e) => {
							// Enter submits; Shift+Enter inserts a newline.
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								if (canSend) onSubmit(value);
							}
						}}
						placeholder={placeholderOverlay ? "" : placeholder}
						autoFocus={autoFocus}
						style={{
							display: "block",
							width: "100%",
							border: "none",
							outline: "none",
							background: "transparent",
							fontFamily: "var(--font-sans)",
							fontSize: big ? 17 : 14.5,
							color: "var(--fg)",
							caretColor: "var(--teal-500)",
							lineHeight: 1.5,
							padding: 0,
							margin: 0,
							resize: "none",
							overflowY: "auto",
							maxHeight: 300,
						}}
					/>
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					marginTop: big ? 30 : 12,
				}}
			>
				<span
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						maxWidth: 220,
						fontSize: 13,
						fontWeight: 500,
						color: location
							? "var(--teal-700)"
							: "var(--text-body)",
					}}
				>
					<Icon
						name="map-pin"
						size={14}
						style={{ flex: "none" }}
					/>{" "}
					<span
						style={{
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{location ?? "Anywhere in Australia"}
					</span>
				</span>
				<span style={{ flex: 1 }} />
				{models && onModelChange ? (
					<div
						className="hidden sm:inline-flex"
						style={{
							position: "relative",
							alignItems: "center",
						}}
					>
						<select
							aria-label="Model"
							value={model}
							onChange={(e) => onModelChange(e.target.value)}
							// The hero composer steals focus on click; stop bubbling so the native
							// dropdown isn't slammed shut by that focus-steal.
							onMouseDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
							style={{
								appearance: "none",
								WebkitAppearance: "none",
								background: "transparent",
								border: "none",
								fontFamily: "var(--font-sans)",
								fontSize: 13,
								color: "var(--muted-fg)",
								cursor: "pointer",
								padding: "0 18px 0 0",
								outline: "none",
							}}
						>
							{models.map((m) => (
								<option
									key={m.id}
									value={m.id}
								>
									{m.label}
								</option>
							))}
						</select>
						<span
							style={{
								position: "absolute",
								right: 0,
								color: "var(--muted-fg)",
								pointerEvents: "none",
							}}
						>
							<Icon
								name="chevron-down"
								size={13}
							/>
						</span>
					</div>
				) : (
					<span
						style={{
							fontSize: 13,
							color: "var(--muted-fg)",
							display: "inline-flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						{selectedLabel}{" "}
						<Icon
							name="chevron-down"
							size={13}
						/>
					</span>
				)}
				<button
					type="submit"
					aria-label="Send"
					disabled={!canSend}
					style={{
						width: big ? 46 : 32,
						height: big ? 46 : 32,
						borderRadius: "var(--radius-pill)",
						background: "var(--color-primary)",
						color: "#fff",
						border: "none",
						cursor: canSend ? "pointer" : "default",
						opacity: canSend ? 1 : 0.55,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow: "var(--shadow-teal)",
						transition: "opacity .15s ease",
					}}
				>
					<Icon
						name={big ? "arrow-right" : "arrow-up"}
						size={big ? 22 : 17}
					/>
				</button>
			</div>
		</form>
	);
}
