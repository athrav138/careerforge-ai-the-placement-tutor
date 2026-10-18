"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { Bot, ChevronRight, CirclePlus, LoaderCircle, MessageSquareText, Send, Sparkles, Trash2 } from "lucide-react";

type Action = { type: string; id: string; label: string; href: string };
type Message = { id: string; role: "USER" | "ASSISTANT"; content: string; actions?: Action[] | null; createdAt: string };
type Conversation = { id: string; title: string | null; createdAt: string; updatedAt: string; lastMessage?: { content: string; createdAt: string } | null; messages?: Message[] };

const suggested = ["What should I focus on today?", "Analyze my biggest skill gaps", "How can I improve my resume?", "Create a 7-day placement plan"];

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Unable to complete that request.");
  return payload;
}

function createOptimisticMessage(content: string): Message {
  return { id: `pending-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() };
}

export default function Mentor() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const openConversation = async (id: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const data = await readResponse(await fetch(`/api/mentor/conversations/${id}`, { cache: "no-store" }));
      setActiveConversation(data.conversation);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load conversation.");
    } finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const data = await readResponse(await fetch("/api/mentor/conversations", { cache: "no-store" }));
        if (cancelled) return;
        setConversations(data.conversations);
        if (data.conversations.length) {
          const first = await readResponse(await fetch(`/api/mentor/conversations/${data.conversations[0].id}`, { cache: "no-store" }));
          if (!cancelled) setActiveConversation(first.conversation);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load conversations.");
      } finally { if (!cancelled) setLoading(false); }
    };
    void initialize();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [activeConversation?.messages?.length, sending]);

  const createConversation = async () => {
    setError("");
    try {
      const data = await readResponse(await fetch("/api/mentor/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
      const conversation = { ...data.conversation, messages: [] } as Conversation;
      setConversations((current) => [conversation, ...current]);
      setActiveConversation(conversation);
      return conversation;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start a conversation.");
      return null;
    }
  };

  const sendMessage = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const content = (preset ?? input).trim();
    if (!content || sending) return;
    const conversation = activeConversation ?? await createConversation();
    if (!conversation) return;
    setSending(true); setError(""); setInput("");
    const optimistic = createOptimisticMessage(content);
    setActiveConversation((current) => current ? { ...current, messages: [...(current.messages ?? []), optimistic] } : current);
    try {
      const data = await readResponse(await fetch(`/api/mentor/conversations/${conversation.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }));
      setActiveConversation((current) => current ? { ...current, title: current.title ?? content.slice(0, 72), messages: [...(current.messages ?? []).filter((message) => message.id !== optimistic.id), data.userMessage, { ...data.assistantMessage, actions: data.actions }] } : current);
      setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, title: item.title ?? content.slice(0, 72), updatedAt: new Date().toISOString(), lastMessage: { content: data.assistantMessage.content, createdAt: data.assistantMessage.createdAt } } : item).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (requestError) {
      setActiveConversation((current) => current ? { ...current, messages: (current.messages ?? []).filter((message) => message.id !== optimistic.id) } : current);
      setInput(content);
      setError(requestError instanceof Error ? requestError.message : "Unable to send message.");
    } finally { setSending(false); }
  };

  const removeConversation = async () => {
    if (!activeConversation || !window.confirm("Delete this mentor conversation?")) return;
    try {
      await readResponse(await fetch(`/api/mentor/conversations/${activeConversation.id}`, { method: "DELETE" }));
      const next = conversations.filter((conversation) => conversation.id !== activeConversation.id);
      setConversations(next); setActiveConversation(null);
      if (next[0]) await openConversation(next[0].id, false);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to delete conversation."); }
  };

  const messages = activeConversation?.messages ?? [];
  return <>
    <DashboardHeader title="AI placement mentor" subtitle="Personalized guidance grounded in your CareerForge progress." />
    <Panel className="min-h-[650px] rounded-xl p-0">
      <div className="grid min-h-[650px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
          <button type="button" onClick={() => void createConversation()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><CirclePlus size={16} /> New conversation</button>
          <div className="mt-5 text-xs font-semibold text-muted">CONVERSATIONS</div>
          <div className="mt-2 flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
            {conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => void openConversation(conversation.id)} className={`min-w-48 shrink-0 border px-3 py-2.5 text-left text-sm lg:min-w-0 lg:w-full ${activeConversation?.id === conversation.id ? "border-cyan/30 bg-cyan/10 text-ink" : "border-transparent text-muted hover:border-line hover:bg-white"}`}><span className="block truncate font-medium">{conversation.title || "New conversation"}</span><span className="mt-1 block truncate text-xs opacity-75">{conversation.lastMessage?.content || "No messages yet"}</span></button>)}
            {!loading && !conversations.length && <p className="py-4 text-xs leading-relaxed text-muted">Start a conversation to get guidance from your current preparation data.</p>}
          </div>
        </aside>
        <section className="flex min-h-[650px] min-w-0 flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan"><Bot size={19} /></div><div><h2 className="text-sm font-bold text-ink">CareerForge Mentor</h2><p className="text-xs text-muted">Uses your career, skills, roadmap, projects, interview, and readiness data.</p></div></div>{activeConversation && <button type="button" onClick={() => void removeConversation()} className="inline-flex h-9 w-9 items-center justify-center text-muted hover:text-red-600" aria-label="Delete conversation" title="Delete conversation"><Trash2 size={16} /></button>}</div>
          {error && <div className="mx-5 mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5">
            {loading ? <div className="flex h-full min-h-64 items-center justify-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} /> Loading mentor conversations</div> : messages.length ? messages.map((message) => <div key={message.id} className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] border px-4 py-3 text-sm leading-relaxed sm:max-w-[76%] ${message.role === "USER" ? "border-cyan bg-cyan text-white" : "border-line bg-white text-ink"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.role === "ASSISTANT" && Array.isArray(message.actions) && message.actions.length > 0 && <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">{message.actions.map((action) => <Link key={action.id} href={action.href} className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:underline"><ChevronRight size={14} /> {action.label}</Link>)}</div>}</div></div>) : <div className="flex min-h-64 flex-col items-center justify-center text-center"><MessageSquareText className="mb-3 text-cyan" size={26} /><h3 className="text-sm font-bold text-ink">Ask about your placement preparation</h3><p className="mt-1 max-w-md text-sm leading-relaxed text-muted">Your mentor uses the progress CareerForge has already recorded. It will say when a signal is not available.</p></div>}
            {sending && <div className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin" size={16} /> Building personalized guidance</div>}
          </div>
          <div className="border-t border-line bg-white p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggested.map((item) => <button key={item} type="button" disabled={sending} onClick={() => void sendMessage(undefined, item)} className="shrink-0 border border-line bg-slate-50 px-3 py-1.5 text-xs text-muted hover:border-cyan/35 hover:text-ink"><Sparkles className="mr-1 inline" size={13} />{item}</button>)}</div><form onSubmit={(event) => void sendMessage(event)} className="flex items-end gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={2} className="min-h-[46px] flex-1 resize-none border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/10" placeholder="Ask your mentor about your next step" /><button type="submit" disabled={!input.trim() || sending} className="inline-flex h-11 w-11 shrink-0 items-center justify-center bg-cyan text-white disabled:opacity-50" aria-label="Send message" title="Send message"><Send size={17} /></button></form></div>
        </section>
      </div>
    </Panel>
  </>;
}
