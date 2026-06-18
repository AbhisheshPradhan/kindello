"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
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
	// Model selector hidden for now — flip to `true` to re-enable.
	const showModelPicker: boolean = false;
	const inputRef = useRef<HTMLTextAreaElement>(null);

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
			className={cn(
				"bg-card border transition-[border-color,box-shadow] duration-150 focus-within:border-teal-400 focus-within:ring-[3px] focus-within:ring-teal-500/16",
				big
					? "rounded-2xl p-4.5 shadow-lg"
					: "rounded-xl pt-3.5 px-4 pb-2.75 shadow-md",
			)}
			style={style}
		>
			<div className="flex items-start gap-3">
				{big && (
					<span className="hidden sm:inline-block text-teal-500 mt-0.5 flex-none">
						<Icon
							name="sparkles"
							size={22}
						/>
					</span>
				)}
				<div className="flex-1 relative min-w-0">
					{placeholderOverlay && value === "" && (
						<div
							className={cn(
								"absolute inset-0 flex items-center pointer-events-none font-sans text-muted-foreground leading-[1.5] whitespace-nowrap overflow-hidden",
								big ? "text-[17px]" : "text-[14.5px]",
							)}
						>
							{placeholderOverlay}
						</div>
					)}
					<textarea
						ref={inputRef}
						rows={1}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={(e) => {
							// Enter submits; Shift+Enter inserts a newline.
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								if (canSend) onSubmit(value);
							}
						}}
						placeholder={placeholderOverlay ? "" : placeholder}
						autoFocus={autoFocus}
						className={cn(
							"block w-full border-none outline-none bg-transparent font-sans text-foreground leading-[1.5] p-0 m-0 resize-none overflow-y-auto max-h-75",
							big ? "text-[17px]" : "text-[14.5px]",
						)}
					/>
				</div>
			</div>
			<div
				className={cn(
					"flex items-center gap-2.5",
					big ? "mt-7.5" : "mt-3",
				)}
			>
				<span
					className={cn(
						// In hero (lg) mode the send button is taller than this row's
						// text, so drop the location chip to the bottom to line up
						// with the button's lower edge.
						"inline-flex items-center gap-1.5 max-w-55 text-[13px] font-medium",
						big ? "self-end pb-1.5" : "self-center",
						location ? "text-teal-700" : "text-muted-foreground",
					)}
				>
					<Icon
						name="map-pin"
						size={14}
						style={{ flex: "none" }}
					/>{" "}
					<span className="truncate">
						{location ?? "Anywhere in Australia"}
					</span>
				</span>
				<span className="flex-1" />
				{showModelPicker &&
					(models && onModelChange ? (
						<div className="hidden sm:inline-flex relative items-center">
							<select
								aria-label="Model"
								value={model}
								onChange={(e) => onModelChange(e.target.value)}
								// The hero composer steals focus on click; stop bubbling so the native
								// dropdown isn't slammed shut by that focus-steal.
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => e.stopPropagation()}
								className="appearance-none bg-transparent border-none font-sans text-[13px] text-muted-foreground pr-4.5 pl-0 outline-none"
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
							<span className="absolute right-0 text-muted-foreground pointer-events-none">
								<Icon
									name="chevron-down"
									size={13}
								/>
							</span>
						</div>
					) : (
						<span className="text-[13px] text-muted-foreground inline-flex items-center gap-1">
							{selectedLabel}{" "}
							<Icon
								name="chevron-down"
								size={13}
							/>
						</span>
					))}
				<button
					type="submit"
					aria-label="Send"
					disabled={!canSend}
					className={cn(
						"rounded-full bg-primary text-white border-none inline-flex items-center justify-center shadow-teal transition-opacity duration-150",
						big ? "w-11.5 h-11.5" : "w-8 h-8",
						canSend
							? "opacity-100 cursor-pointer"
							: "opacity-55 cursor-default",
					)}
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
