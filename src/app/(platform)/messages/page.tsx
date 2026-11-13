"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ChatsCircle, MagnifyingGlass, NotePencil, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { useMarkMessageReadMutation, useMeQuery, useMyMessagesQuery, usePeopleQuery, useSendMessageMutation } from "@/lib/api/farmnomad";
import type { Message } from "@/lib/types/api";
import { Avatar, EmptyState, IconButton, Skeleton, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Thread = { id: number; name: string; last: Message; unread: number; messages: Message[] };

/**
 * Messages (spec §7.12, §3.12). GET /messages returns every message you've sent or received;
 * threads are grouped here by the other person. Polls every few seconds until STOMP lands.
 * Open a thread straight from an order or job with /messages?to={userId}&name={name}.
 */
export default function MessagesPage() {
  const { data: me } = useMeQuery();
  const { data: all, isLoading } = useMyMessagesQuery(undefined, { pollingInterval: 3000 });
  const [openId, setOpenId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState<Record<number, string>>({});
  const [q, setQ] = useState("");
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const to = Number(p.get("to"));
    if (to) {
      setOpenId(to);
      const name = p.get("name");
      if (name) setDraftName((d) => ({ ...d, [to]: name }));
    }
  }, []);

  const threads = useMemo<Thread[]>(() => {
    if (!all || !me) return [];
    const map = new Map<number, Thread>();
    for (const m of [...all].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))) {
      const mine = m.senderId === me.id;
      const id = mine ? m.recipientId : m.senderId;
      const name = (mine ? m.recipientName : m.senderName) ?? draftName[id] ?? "FarmNomad user";
      const t = map.get(id) ?? { id, name, last: m, unread: 0, messages: [] };
      t.messages.push(m);
      t.last = m;
      if (!mine && !m.read) t.unread++;
      map.set(id, t);
    }
    return [...map.values()].sort((a, b) => +new Date(b.last.createdAt) - +new Date(a.last.createdAt));
  }, [all, me, draftName]);

  const shown = threads.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const open = threads.find((t) => t.id === openId) ?? (openId ? { id: openId, name: draftName[openId] ?? "New message", messages: [], unread: 0 } : null);

  const select = (id: number | null) => {
    setOpenId(id);
    window.history.replaceState(null, "", id ? `/messages?to=${id}` : "/messages");
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Conversation list */}
      <aside className={cn("flex w-full min-w-0 flex-col border-r border-app-line md:w-[320px] md:shrink-0", open && "hidden md:flex")} aria-label="Conversations">
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
          <h1 className="font-display text-[22px] font-medium tracking-[-0.03em]">Messages</h1>
          <IconButton label="New message" onClick={() => setPicking(true)}>
            <NotePencil className="size-[18px]" />
          </IconButton>
        </div>
        <div className="px-4 pb-3">
          <label className="flex h-8 items-center gap-2 rounded-[7px] bg-app-hover px-2.5 text-app-faint">
            <MagnifyingGlass className="size-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="min-w-0 flex-1 bg-transparent text-app-text outline-none placeholder:text-app-faint" />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {isLoading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="mx-2 my-1.5 h-14" />)
          ) : !shown.length ? (
            <li className="px-3 py-10 text-center text-app-faint">{q ? "No one by that name." : "No messages yet."}</li>
          ) : (
            shown.map((t) => (
              <li key={t.id}>
                <button onClick={() => select(t.id)} className={cn("flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-left transition-colors", openId === t.id ? "bg-app-active" : "hover:bg-app-hover")}>
                  <Avatar name={t.name} className="size-9 text-[12px]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", t.unread ? "font-semibold" : "font-medium")}>{t.name}</span>
                      <span className="num shrink-0 text-ui-sm text-app-faint">{stamp(t.last.createdAt)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-ui-sm", t.unread ? "text-app-text" : "text-app-faint")}>
                        {t.last.senderId === me?.id && "You: "}
                        {t.last.content}
                      </span>
                      {!!t.unread && <span className="num ml-auto grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-app-accent px-1 text-[10px] font-semibold text-white dark:text-black">{t.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Thread */}
      <section className={cn("min-w-0 flex-1 flex-col", open ? "flex" : "hidden md:flex")} aria-label="Conversation">
        {open ? (
          <ThreadView key={open.id} t={open} meId={me?.id ?? 0} onBack={() => select(null)} />
        ) : (
          <div className="grid flex-1 place-items-center">
            <EmptyState icon={<ChatsCircle className="size-5" />} title="Pick a conversation" body="Talk to farms, drivers and buyers about orders and deliveries, without swapping numbers." />
          </div>
        )}
      </section>

      <AnimatePresence>{picking && <PeoplePicker onClose={() => setPicking(false)} onPick={(id, name) => (setDraftName((d) => ({ ...d, [id]: name })), select(id), setPicking(false))} />}</AnimatePresence>
    </div>
  );
}

function ThreadView({ t, meId, onBack }: { t: Pick<Thread, "id" | "name" | "messages">; meId: number; onBack: () => void }) {
  const [send, { isLoading }] = useSendMessageMutation();
  const [markRead] = useMarkMessageReadMutation();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // Read what's on screen.
  useEffect(() => {
    t.messages.filter((m) => m.recipientId === meId && !m.read).forEach((m) => markRead(m.id));
  }, [t.messages, meId, markRead]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [t.messages.length]);
  useEffect(() => {
    box.current?.focus();
  }, []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      await send({ recipientId: t.id, content, recipientName: t.name }).unwrap();
    } catch {
      setText(content);
    }
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-app-line px-3 md:px-5">
        <IconButton label="Back to conversations" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="size-[18px]" />
        </IconButton>
        <Avatar name={t.name} className="size-8 text-[11px]" />
        <p className="truncate font-medium">{t.name}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
        {!t.messages.length && <p className="py-10 text-center text-app-faint">Say hello to {t.name}.</p>}
        <ol className="mx-auto grid max-w-[680px] gap-1.5">
          {t.messages.map((m, i) => {
            const mine = m.senderId === meId;
            const day = relDay(m.createdAt);
            const showDay = i === 0 || day !== relDay(t.messages[i - 1].createdAt);
            const grouped = i > 0 && t.messages[i - 1].senderId === m.senderId && !showDay;
            return (
              <li key={m.id} className="grid">
                {showDay && <p className="my-3 text-center text-ui-sm text-app-faint">{day}</p>}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("group flex max-w-[78%] items-end gap-2", mine ? "justify-self-end" : "justify-self-start", !grouped && i > 0 && "mt-2")}
                >
                  <span
                    className={cn(
                      "whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 leading-snug",
                      mine ? "rounded-br-[6px] bg-app-primary text-app-on-primary" : "rounded-bl-[6px] bg-app-hover text-app-text",
                    )}
                  >
                    {m.content}
                  </span>
                  <span className="num shrink-0 pb-1 text-[11px] text-app-faint opacity-0 transition-opacity group-hover:opacity-100">{time(m.createdAt)}</span>
                </motion.div>
              </li>
            );
          })}
        </ol>
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="shrink-0 border-t border-app-line p-3 md:px-8">
        <div className="mx-auto flex max-w-[680px] items-end gap-2 rounded-[14px] bg-app-hover p-1.5 pl-3.5 shadow-[inset_0_0_0_1px_var(--a-line)] focus-within:shadow-[inset_0_0_0_1px_var(--a-accent)]">
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={`Message ${t.name}`}
            aria-label="Message"
            className="max-h-32 min-h-[34px] flex-1 resize-none bg-transparent py-[7px] text-app-text outline-none placeholder:text-app-faint [field-sizing:content]"
          />
          <button type="submit" disabled={!text.trim() || isLoading} aria-label="Send" className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-app-primary text-app-on-primary transition-[opacity,transform] active:scale-95 disabled:opacity-40">
            <PaperPlaneRight weight="fill" className="size-4" />
          </button>
        </div>
        <p className="mx-auto mt-1.5 hidden max-w-[680px] text-[11px] text-app-faint md:block">Enter to send · Shift + Enter for a new line</p>
      </form>
    </>
  );
}

/** Demo directory. In the real app threads start from an order, job or donation. */
function PeoplePicker({ onClose, onPick }: { onClose: () => void; onPick: (id: number, name: string) => void }) {
  const { data } = usePeopleQuery();
  return (
    <div className="fixed inset-0 z-[80] grid items-start justify-items-center px-4 pt-[14vh]">
      <motion.div className="absolute inset-0 bg-black/20 dark:bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="New message"
        className="relative w-full max-w-[420px] overflow-hidden rounded-xl bg-app-panel shadow-pop"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <p className="border-b border-app-line px-4 py-3 font-medium">New message</p>
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {data?.map((p) => (
            <li key={p.id}>
              <button autoFocus={p === data[0]} onClick={() => onPick(p.id, p.name)} className="flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left hover:bg-app-hover focus-visible:bg-app-hover">
                <Avatar name={p.name} className="size-8 text-[11px]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-ui-sm text-app-faint">{p.role}</span>
                </span>
              </button>
            </li>
          )) ?? <Skeleton className="m-2 h-10" />}
        </ul>
      </motion.div>
    </div>
  );
}

function stamp(iso: string) {
  const d = relDay(iso);
  return d === "Today" ? time(iso) : d;
}
