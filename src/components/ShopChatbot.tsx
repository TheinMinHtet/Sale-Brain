"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../utils/supabase";
import { Product } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ConvState =
  | "introduction"
  | "intent_classification"
  | "advertise"
  | "show_product"
  | "will_it_buy"
  | "stock_check"
  | "transaction"
  | "terminate_warm"
  | "terminate_notify";

interface UserPrefs {
  likedProducts: string[];
  dislikedProducts: string[];
  pastOrders: string[];
  preferredLanguage: "en" | "my";
  lastVisit: string;
}

interface ShopChatbotProps {
  shopId: string;
  businessName: string;
  fullPage?: boolean;
  suggestedPrompts?: string[];
  products?: Product[];
  onOpenInfo?: () => void;
}

type Language = "en" | "my";

// ─── Copy ─────────────────────────────────────────────────────────────────────

const MYANMAR_COPY = {
  eyebrow: "AI အရောင်း Chat",
  online: "အွန်လိုင်း",
  greeting: "ဘာရှာပေးရမလဲ?",
  helper: "ပစ္စည်း၊ ပို့ဆောင်မှု၊ ငွေပေးချေမှု၊ စတော့ အကြောင်း မေးနိုင်ပါတယ်။",
  placeholder: "ဆိုင် assistant ကို စာပို့ပါ...",
  send: "ပို့",
  thinking: "စဉ်းစားနေပါတယ်...",
  error: "တုံ့ပြန်လို့မရပါဘူး။ ထပ်စမ်းကြည့်ပါ။",
  connectionError: "ချိတ်ဆက်မှု ပြဿနာရှိပါတယ်။ ထပ်စမ်းကြည့်ပါ။",
  quickPrompts: "အမြန်မေးခွန်းများ",
  productsTitle: "ရနိုင်သော ပစ္စည်းများ",
  productsHint: "များကို scroll လုပ်ကြည့်ပါ။",
  info: "ဆိုင် info",
  language: "ဘာသာစကား",
  openChat: "Chat ဖွင့်ရန်",
  closeChat: "Chat ပိတ်ရန်",
};

const ENGLISH_COPY = {
  eyebrow: "AI Sales Chat",
  online: "Online",
  greeting: "What can I help you find?",
  helper: "Ask about products, delivery, payment, or stock.",
  placeholder: "Message the shop assistant...",
  send: "Send",
  thinking: "Thinking...",
  error: "Sorry, I couldn't respond. Try again.",
  connectionError: "Connection error. Please try again.",
  quickPrompts: "Quick prompts",
  productsTitle: "Available products",
  productsHint: "Scroll sideways through the cards.",
  info: "Shop info",
  language: "Language",
  openChat: "Open chat",
  closeChat: "Close chat",
};

// ─── Memory helpers ───────────────────────────────────────────────────────────

function loadPrefs(shopId: string): UserPrefs {
  try {
    const raw = localStorage.getItem(`shop_prefs_${shopId}`);
    if (raw) return JSON.parse(raw) as UserPrefs;
  } catch {
    // ignore
  }
  return {
    likedProducts: [],
    dislikedProducts: [],
    pastOrders: [],
    preferredLanguage: "my",
    lastVisit: new Date().toISOString(),
  };
}

function savePrefs(shopId: string, prefs: UserPrefs): void {
  try {
    localStorage.setItem(`shop_prefs_${shopId}`, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  businessName: string,
  products: Product[],
  cart: { productId: string; quantity: number }[],
  cartTotal: number,
  convState: ConvState,
  prefs: UserPrefs
): string {
  const productList =
    products.length > 0
      ? products
          .map(
            (p) =>
              `- ${p.name} (ID: ${p.id}): ${p.price.toLocaleString()} MMK, stock: ${p.stock}. ${p.description}`
          )
          .join("\n")
      : "Product catalog is being updated.";

  const cartSummary =
    cart.length > 0
      ? cart
          .map((c) => {
            const p = products.find((x) => x.id === c.productId);
            return `${p?.name ?? c.productId} x${c.quantity}`;
          })
          .join(", ")
      : "empty";

  const likedNames = prefs.likedProducts
    .map((id) => products.find((p) => p.id === id)?.name ?? id)
    .join(", ");

  return `You are "Candy" (ကင်ဒီ), a warm, charming Myanmar sales assistant for "${businessName}".

PERSONALITY:
- Always reply in Myanmar (Burmese) using respectful particles: ပါရှင့်, ရှင့်, ပါ
- Warm, polite, professional tone. Never hallucinate products or prices.
- Keep replies concise (2-4 sentences max unless showing product details).

CURRENT CONVERSATION STATE: ${convState}
STATE INSTRUCTIONS:
- introduction     → Warm welcome, highlight 1-2 bestsellers, ask "ဘာကူညီပေးရမလားရှင်?"
- intent_classification → Determine if user is browsing generally or wants a specific product. Ask a clarifying question if unclear.
- advertise        → Enthusiastically showcase bestsellers with prices. Ask "စိတ်ဝင်စားတာ ရှိလားရှင်?"
- show_product     → Give full product details (name, price, stock, description). End with "မှာချင်ပါသလားရှင်?"
- will_it_buy      → Gently assess purchase intent. Offer encouragement or alternatives.
- stock_check      → Say "စတော့ စစ်ဆေးနေပါတယ်ရှင်..." then report actual stock from product data.
- transaction      → Guide payment: urban areas use "အိမ်ရောက်ငွေချေ (COD) ရပါတယ်ရှင်", regional use "KPay နဲ့ အရင်ငွေလွှဲပေးရပါတယ်ရှင်". Bulk ≥3 items: offer free delivery.
- terminate_warm   → Thank customer warmly, invite them back.
- terminate_notify → Customer wants out-of-stock item: "Sold out ဖြစ်သွားလို့ပါရှင်။ အသစ်ရောက်ရင် အကြောင်းကြားပေးပါမယ်ရှင်။"

PRIORITY RULES (always handle these first, regardless of state):
1. Delivery question → answer with delivery/township info immediately
2. Language switch request → acknowledge and switch
3. Specific product question → go to show_product state
4. Out-of-stock item → go to terminate_notify state

SHOP PRODUCTS:
${productList}

CUSTOMER CART: ${cartSummary} | Total: ${cartTotal.toLocaleString()} MMK
CUSTOMER PREFERENCES: liked: ${likedNames || "none"}, past orders: ${prefs.pastOrders.length}

FUNCTION CALL TAGS (append to your reply when appropriate):
- [STATE:new_state] → transition to a new conversation state
- [ACTION:ADD, ID:product_id] → add product to cart
- [ACTION:CHECKOUT] → proceed to checkout
- [PREF:LIKE, ID:product_id] → user expressed interest in this product
- [PREF:DISLIKE, ID:product_id] → user rejected this product

Example: "ဒီ Halawa က အရမ်းကောင်းပါတယ်ရှင်! [ACTION:ADD, ID:prod-1][STATE:will_it_buy]"
Only include tags that are actually needed. Never show tags to the user — they are stripped before display.`;
}


// ─── Local rule-based fallback (no API key needed) ───────────────────────────

function buildLocalReply(
  text: string,
  products: Product[],
  cart: { productId: string; quantity: number }[],
  state: ConvState,
  businessName: string
): string {
  const t = text.toLowerCase();

  // Delivery question
  if (/deliver|shipping|ပို့|ဆောင်|township|မြို့နယ်/.test(t)) {
    return `ကျွန်မတို့ဆိုင် ${businessName} မှ ရန်ကုန်မြို့တွင်း COD (အိမ်ရောက်ငွေချေ) ရပါတယ်ရှင်။ တိုင်းဒေသကြီးများအတွက် KPay ဖြင့် အရင်ငွေလွှဲပေးရပါတယ်ရှင်။ [STATE:intent_classification]`;
  }

  // Payment question
  if (/pay|ငွေ|kpay|wavepay|cod|prepay/.test(t)) {
    return `ငွေပေးချေမှုနည်းလမ်းများမှာ — မြို့တွင်း COD (အိမ်ရောက်ငွေချေ) နှင့် KPay/WavePay ကြိုငွေလွှဲ ရပါတယ်ရှင်။ [STATE:intent_classification]`;
  }

  // Checkout / order intent
  if (/checkout|order|မှာ|ဝယ်|buy/.test(t)) {
    if (cart.length === 0) {
      return `ဘယ်ပစ္စည်း မှာချင်ပါသလဲရှင်? ကျွန်မ ကူညီပေးပါမယ်ရှင်။ [STATE:show_product]`;
    }
    const total = cart.reduce((s, c) => {
      const p = products.find((x) => x.id === c.productId);
      return s + (p ? p.price * c.quantity : 0);
    }, 0);
    return `စုစုပေါင်း ${total.toLocaleString()} MMK ရှိပါတယ်ရှင်။ COD သို့မဟုတ် KPay ဖြင့် ဆက်လက်ဆောင်ရွက်နိုင်ပါတယ်ရှင်။ [STATE:transaction]`;
  }

  // Product name match
  for (const p of products) {
    if (t.includes(p.name.toLowerCase().split(" ")[0])) {
      const stockNote = p.stock > 0 ? `စတော့ ${p.stock} ခုရှိပါသေးတယ်ရှင်။` : `Sold out ဖြစ်သွားလို့ပါရှင်။ [STATE:terminate_notify]`;
      return `${p.name} — ${p.price.toLocaleString()} MMK ရှိပါတယ်ရှင်။ ${p.description || ""} ${stockNote} မှာချင်ပါသလားရှင်? [STATE:will_it_buy][PREF:LIKE, ID:${p.id}]`;
    }
  }

  // Introduction / greeting
  if (state === "introduction" || /hello|hi|မင်္ဂလာ|ဟဲလို/.test(t)) {
    const highlights = products.slice(0, 2).map((p) => `${p.name} (${p.price.toLocaleString()} MMK)`).join(", ");
    return `မင်္ဂလာပါရှင်! ${businessName} မှ ကြိုဆိုပါတယ်ရှင်။ ${highlights ? `ဒီနေ့ အကြံပြုချင်တာကတော့ ${highlights} ပါရှင်။` : ""} ဘာကူညီပေးရမလားရှင်? [STATE:intent_classification]`;
  }

  // General browse
  if (/product|ပစ္စည်|catalog|show|list/.test(t)) {
    const list = products.map((p) => `• ${p.name} — ${p.price.toLocaleString()} MMK`).join("\n");
    return `ကျွန်မတို့ဆိုင်မှာ ရောင်းနေတဲ့ ပစ္စည်းများ:\n${list}\n\nဘယ်ပစ္စည်း စိတ်ဝင်စားပါသလဲရှင်? [STATE:show_product]`;
  }

  // Default
  return `ကျွန်မ ${businessName} မှ Candy ပါရှင်။ ပစ္စည်းများ၊ ပို့ဆောင်မှု၊ ငွေပေးချေမှု အကြောင်း မေးနိုင်ပါတယ်ရှင်။ ဘာကူညီပေးရမလားရှင်? [STATE:intent_classification]`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShopChatbot({
  shopId,
  businessName,
  fullPage = false,
  suggestedPrompts = [],
  products = [],
  onOpenInfo,
}: ShopChatbotProps) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("my");
  const [composerExpanded, setComposerExpanded] = useState(false);

  // Conversation state machine
  const [convState, setConvState] = useState<ConvState>("introduction");
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadPrefs(shopId));

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = messages.length > 0;
  const copy = language === "en" ? ENGLISH_COPY : MYANMAR_COPY;

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const p = products.find((prod) => prod.id === item.productId);
        return sum + (p ? p.price * item.quantity : 0);
      }, 0),
    [cart, products]
  );

  // Session ID init
  useEffect(() => {
    if (!sessionId) {
      const stored = localStorage.getItem(`shop_session_${shopId}`);
      if (stored) {
        setSessionId(stored);
      } else {
        const id = `pub_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(`shop_session_${shopId}`, id);
        setSessionId(id);
      }
    }
  }, [shopId, sessionId]);

  // Update last visit in prefs
  useEffect(() => {
    const updated = { ...prefs, lastVisit: new Date().toISOString() };
    setPrefs(updated);
    savePrefs(shopId, updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, loading]);

  // Persist prefs whenever they change
  useEffect(() => {
    savePrefs(shopId, prefs);
  }, [shopId, prefs]);

  // ── Parse and apply action/state tags from bot reply ──────────────────────
  function applyTags(
    botText: string,
    currentPrefs: UserPrefs
  ): { cleanText: string; newPrefs: UserPrefs } {
    let newPrefs = { ...currentPrefs };

    // State transition
    const stateMatch = botText.match(/\[STATE:([a-z_]+)\]/);
    if (stateMatch) {
      const next = stateMatch[1] as ConvState;
      setConvState(next);
    }

    // Cart actions
    const addMatch = botText.match(/\[ACTION:ADD, ID:([^\]]+)\]/);
    if (addMatch) {
      const prodId = addMatch[1].trim();
      setCart((curr) => {
        const existing = curr.find((c) => c.productId === prodId);
        if (existing)
          return curr.map((c) =>
            c.productId === prodId ? { ...c, quantity: c.quantity + 1 } : c
          );
        return [...curr, { productId: prodId, quantity: 1 }];
      });
    }

    const checkoutMatch = botText.match(/\[ACTION:CHECKOUT\]/);
    if (checkoutMatch) setConvState("transaction");

    // Preference tracking
    const likeMatch = botText.match(/\[PREF:LIKE, ID:([^\]]+)\]/);
    if (likeMatch) {
      const id = likeMatch[1].trim();
      if (!newPrefs.likedProducts.includes(id)) {
        newPrefs = { ...newPrefs, likedProducts: [...newPrefs.likedProducts, id] };
      }
    }

    const dislikeMatch = botText.match(/\[PREF:DISLIKE, ID:([^\]]+)\]/);
    if (dislikeMatch) {
      const id = dislikeMatch[1].trim();
      if (!newPrefs.dislikedProducts.includes(id)) {
        newPrefs = { ...newPrefs, dislikedProducts: [...newPrefs.dislikedProducts, id] };
      }
    }

    const cleanText = botText
      .replace(/\[STATE:[a-z_]+\]/g, "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/\[PREF:[^\]]+\]/g, "")
      .trim();

    return { cleanText, newPrefs };
  }

  // ── sendMessage ────────────────────────────────────────────────────────────
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setComposerExpanded(false);
    if (composerInputRef.current) composerInputRef.current.style.height = "44px";

    // Advance state on first user message
    if (convState === "introduction") setConvState("intent_classification");

    setMessages((curr) => [...curr, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      // 1. Try Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("shop", {
        body: { action: "chat", shopId, sessionId, content: trimmed },
      });

      if (!error && data?.session) {
        const lastMsg =
          data.session.messages[data.session.messages.length - 1];
        if (lastMsg?.sender === "bot" && !lastMsg.content.includes("direct pipeline is syncing")) {
          const { cleanText, newPrefs } = applyTags(lastMsg.content, prefs);
          setPrefs(newPrefs);
          setMessages((curr) => [...curr, { role: "assistant", content: cleanText }]);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback: Direct Gemini
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        // No API key — use local rule-based response
        const localReply = buildLocalReply(trimmed, products, cart, convState, businessName);
        const { cleanText, newPrefs } = applyTags(localReply, prefs);
        setPrefs(newPrefs);
        setMessages((curr) => [...curr, { role: "assistant", content: cleanText }]);
        setLoading(false);
        return;
      }

      const systemPrompt = buildSystemPrompt(
        businessName,
        products,
        cart,
        cartTotal,
        convState,
        prefs
      );

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nCustomer: ${trimmed}\nCandy:` }] }],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const resData = await response.json();
      const botText: string =
        resData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!botText) throw new Error("Empty response from Gemini");

      const { cleanText, newPrefs } = applyTags(botText, prefs);
      setPrefs(newPrefs);
      setMessages((curr) => [...curr, { role: "assistant", content: cleanText }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      let display = `AI Error: ${msg}`;
      if (msg.includes("Failed to fetch"))
        display = "AI Error: Network blocked. Check VPN or region restrictions.";
      setMessages((curr) => [...curr, { role: "assistant", content: display }]);
    } finally {
      setLoading(false);
    }
  }

  function submitCurrentInput() {
    void sendMessage(input);
  }

  function resizeComposerInput(textarea: HTMLTextAreaElement) {
    textarea.style.height = "44px";
    const next = Math.min(Math.max(textarea.scrollHeight, 44), 144);
    textarea.style.height = `${next}px`;
    setComposerExpanded(next > 52);
  }

  function localizePrompt(prompt: string) {
    if (language === "en") return prompt;
    const map: Record<string, string> = {
      "What products do you sell?": "ဘာပစ္စည်းတွေ ရောင်းပါသလဲ?",
      "What are your delivery options?": "ပို့ဆောင်မှု ရွေးချယ်စရာတွေက ဘာတွေလဲ?",
      "What payment methods do you accept?": "ဘယ်ငွေပေးချေမှုနည်းလမ်းတွေ လက်ခံပါသလဲ?",
      "Recommend a product for me": "ကျွန်တော်/ကျွန်မအတွက် ပစ္စည်းတစ်ခု ညွှန်းပေးပါ",
    };
    if (map[prompt]) return map[prompt];
    const m = prompt.match(/^Tell me about (.+)$/);
    if (m) return `${m[1]} အကြောင်း ပြောပြပါ`;
    return prompt;
  }

  function shouldShowProductCards(index: number) {
    if (!featuredProducts.length || messages[index]?.role !== "assistant") return false;
    const prevUser = [...messages]
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user")?.content;
    return Boolean(
      prevUser &&
        /(what products|products do you sell|catalog|show.*products|recommend|available products|ဘာပစ္စည်း|ပစ္စည်)/i.test(
          prevUser
        )
    );
  }


  // ── JSX pieces ─────────────────────────────────────────────────────────────

  const languageToggle = (
    <div
      className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold"
      aria-label={copy.language}
    >
      {(["en", "my"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setLanguage(opt)}
          className={`rounded-full px-3 py-1.5 transition ${
            language === opt
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt === "en" ? "EN" : "မြန်"}
        </button>
      ))}
    </div>
  );

  const promptBar = suggestedPrompts.length > 0 && (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-1">
      <p className="text-xs font-medium text-slate-500">{copy.quickPrompts}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendMessage(prompt)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            {localizePrompt(prompt)}
          </button>
        ))}
      </div>
    </div>
  );

  const productCards = (
    <div className="mt-3 w-full max-w-full">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{copy.productsTitle}</p>
          <p className="text-xs text-slate-500">
            {copy.productsHint} Showing {featuredProducts.length} of {products.length}.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {products.length}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {featuredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => void sendMessage(`Tell me about ${product.name}`)}
            className="w-52 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="px-3 text-center text-xs font-medium text-slate-500">
                  {product.name}
                </span>
              )}
            </div>
            <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-950">{product.name}</p>
            <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
              {product.description || "Ask for details, price, and stock."}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-950">
                {product.price.toLocaleString()} MMK
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                  product.stock > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {product.stock > 0 ? `${product.stock} left` : "Out"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const composer = (
    <div
      className={`mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto] rounded-[28px] border border-slate-200 bg-white py-2.5 pl-6 pr-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] sm:rounded-[34px] sm:pl-7 ${
        composerExpanded ? "gap-x-2 gap-y-1" : "items-end gap-2"
      }`}
    >
      <textarea
        ref={composerInputRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          resizeComposerInput(e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitCurrentInput();
          }
        }}
        placeholder={language === "en" ? "Ask anything" : "ဘာမဆို မေးပါ"}
        rows={1}
        className="col-start-1 h-11 max-h-36 min-h-11 resize-none overflow-y-auto bg-transparent py-2 text-[18px] leading-7 text-slate-950 outline-none placeholder:text-slate-400 sm:text-[20px]"
      />
      <div className={composerExpanded ? "col-start-2 row-start-2 flex justify-end" : "col-start-2 row-start-1 mb-0.5"}>
        <button
          type="button"
          onClick={submitCurrentInput}
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-2xl font-medium leading-none text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-11 sm:w-11"
          aria-label={copy.send}
        >
          ↑
        </button>
      </div>
    </div>
  );

  const chatShell = (
    <div className="flex h-full min-h-0 flex-col bg-white text-slate-950">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onOpenInfo && (
              <button
                type="button"
                onClick={onOpenInfo}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label={copy.info}
              >
                <span className="flex flex-col gap-1" aria-hidden="true">
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                </span>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {copy.eyebrow}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">{businessName}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {languageToggle}
            <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:block">
              {copy.online}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      {!hasStarted ? (
        <div className="flex min-h-0 flex-1 items-center bg-slate-50/80 px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl -translate-y-8 flex-col gap-5">
            <div className="text-center">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {copy.greeting}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                {copy.helper}
              </p>
            </div>
            <div className="space-y-3">
              {promptBar}
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
                <div key={`${message.role}-${index}`} className="space-y-3">
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  {shouldShowProductCards(index) && productCards}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
                    {copy.thinking}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="space-y-3">
              {promptBar}
              {composer}
            </div>
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
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-sm font-medium text-white shadow-lg transition hover:bg-slate-800 cursor-pointer"
        aria-label={open ? copy.closeChat : copy.openChat}
      >
        {open ? "X" : "Chat"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[min(620px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-3rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          {chatShell}
        </div>
      )}
    </>
  );
}
