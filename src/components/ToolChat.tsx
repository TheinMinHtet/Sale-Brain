import { useState, useRef, useEffect } from "react";
import { supabase } from "../utils/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolChatProps {
  fullPage?: boolean;
}

export function ToolChat({ fullPage = false }: ToolChatProps) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasStarted = messages.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";

    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-tools", {
        body: { messages: newMessages }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages([...newMessages, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "44px";
    const next = Math.min(Math.max(textarea.scrollHeight, 44), 144);
    textarea.style.height = `${next}px`;
  }

  const suggestedPrompts = [
    "Show me all shops",
    "What products are available?",
    "Tell me about shop features",
    "How does Sales Brain AI work?"
  ];

  const composer = (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto] items-end gap-2 rounded-[28px] border border-slate-200 bg-white py-2.5 pl-6 pr-4 shadow-lg">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          resizeTextarea(e.currentTarget);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask about shops, products, or anything..."
        rows={1}
        className="h-11 max-h-36 min-h-11 resize-none overflow-y-auto bg-transparent py-2 text-lg leading-7 text-slate-950 outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => void sendMessage(input)}
        disabled={loading || !input.trim()}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-2xl font-medium leading-none text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        aria-label="Send"
      >
        ↑
      </button>
    </div>
  );

  const chatShell = (
    <div className="flex h-full min-h-0 flex-col bg-white text-slate-950">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              AI Assistant
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Sales Brain AI</h2>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            Online
          </div>
        </div>
      </div>

      {!hasStarted ? (
        <div className="flex min-h-0 flex-1 items-center bg-slate-50/80 px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl -translate-y-8 flex-col gap-5">
            <div className="text-center">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                How can I help you?
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Ask about shops, products, or general questions about Sales Brain AI.
              </p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-1">
                <p className="text-xs font-medium text-slate-500">Quick prompts</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              {composer}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain bg-slate-50/80 px-4 py-6 sm:px-6 no-scrollbar"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-[26px] px-5 py-3 text-sm leading-7 shadow-sm sm:max-w-[78%] ${
                      message.role === "user"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            {composer}
          </div>
        </>
      )}
    </div>
  );

  if (fullPage) return chatShell;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-sm font-medium text-white shadow-lg transition hover:bg-slate-800"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[min(620px,calc(100dvh-8rem))] w-[min(420px,calc(100vw-3rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          {chatShell}
        </div>
      )}
    </>
  );
}
