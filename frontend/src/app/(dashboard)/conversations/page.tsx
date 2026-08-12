"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockConversations = [
  { id: "1", session_id: "sess-001", agent: "Support Bot", status: "ACTIVE",    visitor: "Visitor #4821", created_at: "2026-08-13T00:10:00Z", messages: 6 },
  { id: "2", session_id: "sess-002", agent: "Support Bot", status: "ESCALATED", visitor: "Visitor #3302", created_at: "2026-08-12T23:45:00Z", messages: 14 },
  { id: "3", session_id: "sess-003", agent: "Sales Assistant", status: "ENDED",  visitor: "Visitor #1190", created_at: "2026-08-12T22:30:00Z", messages: 9 },
  { id: "4", session_id: "sess-004", agent: "Support Bot", status: "ACTIVE",    visitor: "Visitor #6634", created_at: "2026-08-12T21:00:00Z", messages: 3 },
  { id: "5", session_id: "sess-005", agent: "Sales Assistant", status: "ENDED",  visitor: "Visitor #2278", created_at: "2026-08-12T20:15:00Z", messages: 7 },
];

const mockMessages: Record<string, { sender: string; content: string; time: string }[]> = {
  "sess-001": [
    { sender: "USER", content: "Hi, I need help with my order.", time: "00:10" },
    { sender: "AI",   content: "Hi there! I'd be happy to help. Could you share your order number?", time: "00:10" },
    { sender: "USER", content: "It's #ORD-9921.", time: "00:11" },
    { sender: "AI",   content: "Let me look that up for you… Your order is currently in transit and expected to arrive by August 15th.", time: "00:11" },
  ],
  "sess-002": [
    { sender: "USER",  content: "I want a full refund immediately!", time: "23:45" },
    { sender: "AI",    content: "I understand your frustration. Let me check your purchase history.", time: "23:45" },
    { sender: "USER",  content: "This is unacceptable. Let me speak to a human.", time: "23:46" },
    { sender: "AI",    content: "You've been connected to a human agent. Please hold on for a moment. 🙋", time: "23:46" },
    { sender: "HUMAN", content: "Hi, I'm Sarah from support. I'll personally resolve this for you right now.", time: "23:48" },
  ],
};

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:    { label: "● Active",    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
    ESCALATED: { label: "⚡ Escalated", className: "border-amber-500/40  bg-amber-500/10  text-amber-400"  },
    ENDED:     { label: "✓ Resolved",  className: "border-slate-500/40  bg-slate-500/10  text-slate-400"  },
  };
  const cfg = map[status] ?? { label: status, className: "" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Sender bubble ────────────────────────────────────────────────────────────
function MessageBubble({ sender, content, time }: { sender: string; content: string; time: string }) {
  const isUser = sender === "USER";
  const isHuman = sender === "HUMAN";
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span className="text-[10px] text-muted-foreground font-medium px-1">
        {isUser ? "Visitor" : isHuman ? "👤 Human Agent" : "🤖 AI"} · {time}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm"
            : isHuman
            ? "bg-emerald-900/50 border border-emerald-700/40 text-emerald-100 rounded-tl-sm"
            : "bg-white/5 border border-white/8 text-foreground rounded-tl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selected, setSelected] = useState<typeof mockConversations[0] | null>(null);
  const [humanReply, setHumanReply] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch conversations list
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/conversations/", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch");
      })
      .then(json => {
        // Map backend schema to frontend format
        const formatted = json.map((c: any) => ({
          id: c.id,
          session_id: c.session_id,
          agent: "Support Agent",
          status: c.status,
          visitor: `Visitor ${c.session_id.substring(0, 4)}`,
          created_at: c.created_at,
          messages: 0
        }));
        setConversations(formatted);
      })
      .catch(err => console.error("Using mock conversations data", err));
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selected) return;
    
    fetch(`http://localhost:8000/api/v1/conversations/${selected.session_id}/messages`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch");
      })
      .then(json => {
        const mappedMsgs = json.messages.map((m: any) => ({
          sender: m.sender,
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        setMessages(mappedMsgs);
      })
      .catch(err => {
        console.error("Using mock messages data", err);
        setMessages(mockMessages[selected.session_id] ?? []);
      });
  }, [selected]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Conversations</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: conversation list ── */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`text-left rounded-xl border p-4 transition-all hover:border-primary/40 hover:bg-primary/5 ${
                selected?.id === conv.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold">{conv.visitor}</span>
                <StatusBadge status={conv.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{conv.agent}</span>
                <span>{conv.messages} messages</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground/60">
                {new Date(conv.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        {/* ── Right: transcript view ── */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card className="flex flex-col h-full min-h-[520px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selected.visitor}</CardTitle>
                    <CardDescription>Agent: {selected.agent} · Session {selected.session_id}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {selected.status === "ACTIVE" && (
                      <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                        ⚡ Escalate
                      </Button>
                    )}
                    {selected.status !== "ENDED" && (
                      <Button size="sm" variant="outline" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                        ✓ Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-80 pr-2">
                {messages.length > 0
                  ? messages.map((m, i) => (
                      <MessageBubble key={i} sender={m.sender} content={m.content} time={m.time} />
                    ))
                  : <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
                }
              </CardContent>

              {/* Human reply box — only shown for escalated */}
              {selected.status === "ESCALATED" && (
                <div className="border-t border-border p-4 flex gap-3">
                  <input
                    className="flex-1 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm outline-none focus:border-primary/40"
                    placeholder="Type a reply as human agent…"
                    value={humanReply}
                    onChange={(e) => setHumanReply(e.target.value)}
                  />
                  <Button size="sm" disabled={!humanReply.trim()}>Send</Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-[520px]">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">Select a conversation to view the transcript</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
