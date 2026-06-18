import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** UserBubble — a parent's message: right-aligned teal chat bubble. */
export function UserBubble({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<div
			className={cn(
				"w-fit max-w-[78%] ml-auto bg-primary text-white px-4 py-2.75 rounded-[18px_18px_4px_18px] font-sans text-[14.5px] leading-[1.45]",
				className,
			)}
			style={style}
		>
			{children}
		</div>
	);
}
