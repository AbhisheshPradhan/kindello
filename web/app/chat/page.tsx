import { redirect } from "next/navigation";

// Bare /chat has no conversation to show — the homepage is the only entry point,
// and it routes to /chat/<id> once you ask. (This replaced the old standalone
// prompt-kit chat page; ChatView is now the single chat UI.)
export default function ChatIndex() {
	redirect("/");
}
