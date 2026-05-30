import { ToolChat } from "../components/ToolChat";

export function ToolChatDemo() {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-950">Tool-Based Chat Demo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask about shops, products, or general questions. The AI will fetch real data from Supabase when needed.
        </p>
      </header>
      <main className="flex-1 overflow-hidden">
        <ToolChat fullPage />
      </main>
    </div>
  );
}
