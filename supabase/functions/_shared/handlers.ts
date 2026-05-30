import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { createDefaultState } from "./defaults.ts";
import type { ChatMessage, Order, SystemState } from "./types.ts";
import type { ShopContext } from "./context.ts";
import { processCustomerMessage } from "./botEngine.ts";
import { getTelegramChatId, registerTelegramWebhook } from "./telegram.ts";
import { syncShopKnowledge } from "./knowledge.ts";

const strategyCache: Record<string, { text: string; at: number }> = {};
const STRATEGY_TTL = 15 * 60 * 1000;

export async function handleAction(
  ctx: ShopContext,
  action: string,
  body: Record<string, unknown>,
  query: URLSearchParams
): Promise<unknown> {
  switch (action) {
    case "onboarding":
      return handleOnboarding(ctx, body);
    case "sync-knowledge":
      return syncShopKnowledge(ctx);
    case "reset":
      return handleReset(ctx);
    case "orders/update":
      return handleOrderUpdate(ctx, body);
    case "bot/takeover":
      return handleBotTakeover(ctx, body);
    case "bot/release":
      return handleBotRelease(ctx, body);
    case "bot/owner-reply":
      return handleOwnerReply(ctx, body);
    case "bot/simulate-input":
      return processCustomerMessage(ctx, String(body.sessionId || "default_customer"), body as never);
    case "ai/strategy":
      return handleAiStrategy(ctx, body, query);
    case "ai/marketing/insights":
      return handleMarketingInsights(ctx, body);
    case "ai/marketing/image":
      return handleMarketingImage(ctx, body);
    case "messenger/status":
      return handleMessengerStatus();
    case "messenger/auth-url":
      return handleMessengerAuthUrl();
    case "messenger/connect-page":
      return handleMessengerConnectPage(ctx, body);
    case "messenger/disconnect":
      return handleMessengerDisconnect(ctx);
    default:
      return { error: `Unknown action: ${action}` };
  }
}

async function handleOnboarding(ctx: ShopContext, body: Record<string, unknown>) {
  const b = body as Record<string, string | boolean | undefined>;
  ctx.state.config = {
    shopName: String(b.shopName || "SME Store"),
    ownerName: String(b.ownerName || "Owner"),
    phone: String(b.phone || ""),
    currency: "MMK",
    telegramBotToken: String(b.telegramBotToken || ""),
    telegramBotUsername: String(b.telegramBotUsername || ""),
    messengerPageAccessToken: String(b.messengerPageAccessToken || ""),
    messengerVerifyToken: String(b.messengerVerifyToken || ""),
    messengerBotId: String(b.messengerBotId || "messenger"),
    messengerBotName: String(b.messengerBotName || "Messenger Bot"),
    onboardingCompleted: b.onboardingCompleted !== undefined ? Boolean(b.onboardingCompleted) : true,
    shopId: b.shopId ? String(b.shopId) : ctx.state.config.shopId,
  };
  await ctx.save();

  // Sync to database table for public shop mapping
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error: dbError } = await supabase
    .from("business_onboarding")
    .upsert({
      user_id: ctx.userId,
      business_name: ctx.state.config.shopName,
      owner_name: ctx.state.config.ownerName,
      phone: ctx.state.config.phone,
      shop_id: ctx.state.config.shopId,
      onboarding_completed: ctx.state.config.onboardingCompleted,
    }, { onConflict: 'user_id' });

  if (dbError) {
    console.error("[onboarding-db-sync]", dbError);
  }

  if (ctx.state.config.telegramBotToken) {
    await registerTelegramWebhook(ctx.userId, ctx.state.config.telegramBotToken);
  }
  return { success: true, config: ctx.state.config };
}

async function handleReset(ctx: ShopContext) {
  ctx.state = createDefaultState();
  await ctx.save();
  return { message: "Store reset to defaults", state: ctx.state };
}

async function handleOrderUpdate(ctx: ShopContext, body: Record<string, unknown>) {
  const orderId = String(body.orderId || "");
  const status = body.status as Order["status"];
  const order = ctx.state.orders.find((o) => o.id === orderId);
  if (!order) return { error: "Order not found" };

  order.status = status;
  if (status === "confirmed") {
    order.items.forEach((item) => {
      const prod = ctx.state.products.find((p) => p.id === item.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - item.quantity);
    });
  }

  const relatedSession = Object.values(ctx.state.sessions).find((s) => s.activeOrderId === orderId);
  if (relatedSession) {
    let text = "";
    if (status === "confirmed") {
      text = `Order Confirmed! Invoice ${order.invoiceId} — ${order.totalAmount.toLocaleString()} MMK`;
      relatedSession.messages.push({
        id: `ms-conf-${Date.now()}`,
        sender: "bot",
        content: text,
        timestamp: new Date().toISOString(),
        invoiceData: order,
      });
      relatedSession.currentStep = "completed";
    } else if (status === "cancelled") {
      text = "Order Cancelled. Please contact the shop if you have questions.";
      relatedSession.messages.push({
        id: `ms-canc-${Date.now()}`,
        sender: "bot",
        content: text,
        timestamp: new Date().toISOString(),
      });
    }
    const tgChatId = getTelegramChatId(relatedSession.sessionId);
    if (tgChatId && text) await ctx.sendTelegram(tgChatId, text);
  }

  await ctx.save();
  return { success: true, orders: ctx.state.orders, products: ctx.state.products };
}

async function handleBotTakeover(ctx: ShopContext, body: Record<string, unknown>) {
  const sessionId = String(body.sessionId || "");
  const session = ctx.state.sessions[sessionId];
  if (session) {
    session.liveTakeoverActive = true;
    session.currentStep = "live_takeover";
    session.messages.push({
      id: `m-tk-${Date.now()}`,
      sender: "system",
      content: "Shop Owner has joined the chat. AI deactivated.",
      timestamp: new Date().toISOString(),
    });
    await ctx.save();
  }
  return { success: true, session };
}

async function handleBotRelease(ctx: ShopContext, body: Record<string, unknown>) {
  const sessionId = String(body.sessionId || "");
  const session = ctx.state.sessions[sessionId];
  if (session) {
    session.liveTakeoverActive = false;
    session.currentStep = "browsing";
    session.messages.push({
      id: `m-rl-${Date.now()}`,
      sender: "system",
      content: "Shop Owner left. Candy AI is back online.",
      timestamp: new Date().toISOString(),
    });
    await ctx.save();
  }
  return { success: true, session };
}

async function handleOwnerReply(ctx: ShopContext, body: Record<string, unknown>) {
  const sessionId = String(body.sessionId || "");
  const content = String(body.content || "");
  const session = ctx.state.sessions[sessionId];
  if (!session) return { error: "Session missing" };

  const ownerMsg: ChatMessage = {
    id: `mo-${Date.now()}`,
    sender: "owner",
    content,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(ownerMsg);
  session.lastActive = new Date().toISOString();
  await ctx.save();

  const tgChatId = getTelegramChatId(sessionId);
  if (tgChatId) {
    await ctx.sendTelegram(tgChatId, `Message from Shop Owner:\n\n${content}`);
  }
  return { success: true, session };
}

async function handleAiStrategy(ctx: ShopContext, body: Record<string, unknown>, query: URLSearchParams) {
  const force = query.get("force") === "true" || body.force === true;
  const lang = String(query.get("lang") || body.lang || "en");
  const cacheKey = `${ctx.userId}:${lang}`;
  const now = Date.now();

  if (!force && strategyCache[cacheKey] && now - strategyCache[cacheKey].at < STRATEGY_TTL) {
    return { success: true, strategy: strategyCache[cacheKey].text };
  }

  try {
    const ai = ctx.getGemini();
    let totalRevenue = 0;
    const itemsPurchasedCount: Record<string, number> = {};
    ctx.state.orders.forEach((o) => {
      if (o.status !== "cancelled") {
        totalRevenue += o.totalAmount - o.deliveryFee;
        o.items.forEach((i) => {
          itemsPurchasedCount[i.productName] = (itemsPurchasedCount[i.productName] || 0) + i.quantity;
        });
      }
    });

    const aiRes = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate SME strategy for:\n${JSON.stringify({
        revenue: totalRevenue,
        orders: ctx.state.orders.length,
        items: itemsPurchasedCount,
        products: ctx.state.products.map((p) => ({ name: p.name, stock: p.stock })),
      })}`,
      config: {
        systemInstruction: `You are Sales Brain advisor. Write a detailed, comprehensive, and professional SME strategy report in ${lang === "my" ? "Burmese" : "English"}. Provide deep insights and actionable steps. No markdown hashes or asterisks. Aim for a thorough analysis of around 600-800 words.`,
        temperature: 0.4,
      },
    });

    const strategyText = aiRes.text || "Unable to generate strategy.";
    strategyCache[cacheKey] = { text: strategyText, at: now };
    return { success: true, strategy: strategyText };
  } catch {
    const fallback =
      lang === "my"
        ? "စနစ်အတွင်းရှိ အချက်အလက်များအရ အရောင်းမြှင့်တင်ရန် ဆောင်ရွက်နိုင်ပါသည်။"
        : "Peak sales often occur 6-9 PM. Promote bundles and prepayment for faster checkout.";
    strategyCache[cacheKey] = { text: fallback, at: now };
    return { success: true, strategy: fallback };
  }
}

async function handleMarketingInsights(ctx: ShopContext, body: Record<string, unknown>) {
  const campaignType = String(body.campaignType || "General");
  const productIds = (body.productIds as string[]) || [];
  const selected = ctx.state.products.filter(
    (p) => !productIds.length || productIds.includes(p.id)
  );
  const primary = selected[0] || ctx.state.products[0];

  try {
    const ai = ctx.getGemini();
    const prompt = `Campaign: ${campaignType}. Products: ${selected.map((p) => p.name).join(", ")}. Return JSON with trendingProducts, recommendations, copywriting (provide detailed, long-form, and persuasive captions for Facebook, Instagram, and a full professional email template), bannerPrompt.`;
    const aiRes = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: { temperature: 0.5, responseMimeType: "application/json" },
    });
    const insights = JSON.parse(aiRes.text?.trim() || "{}");
    return { success: true, insights };
  } catch {
    return {
      success: true,
      insights: {
        trendingProducts: selected.slice(0, 2).map((p) => p.name),
        underperformingProducts: [],
        lowStockAlerts: ctx.state.products.filter((p) => p.stock < 10).map((p) => `${p.name}: ${p.stock} left`),
        analyticsSummary: {
          salesGrowthEstimate: "+20%",
          engagementLevel: "Moderate",
        },
        recommendations: [
          {
            campaignTitle: `${campaignType} Campaign`,
            rationale: `Promote ${primary?.name || "your catalog"}`,
            targetAudience: "Myanmar SME shoppers",
            discountPercentage: "10% OFF",
            duration: "7 Days",
            expectedImpact: "Higher weekend conversions",
            implementationSteps: ["Post on Facebook", "Enable KPay prepay", "Bundle top products"],
          },
        ],
        copywriting: {
          facebookCaption: {
            en: `Special ${campaignType} offer on ${primary?.name || "our products"}!`,
            my: `${campaignType} အထူးပရိုမိုးရှင်း — ${primary?.name || "ကုန်ပစ္စည်း"}!`,
          },
          instagramCaption: { en: "Order now!", my: "ယခုမှာယူပါ!" },
          adCopy: { en: "Limited time deal", my: "အချိန်ကန့်သတ်အပ提议" },
          email: { en: "Dear customer...", my: "ချစ်ခင်ရသော ဆိုင်ဝယ်သူ..." },
          hashtags: `#${campaignType} #MyanmarSME`,
        },
        bannerPrompt: `Marketing poster for ${primary?.name || "Myanmar products"}, ${campaignType} theme, 3:4 portrait`,
      },
    };
  }
}

async function handleMarketingImage(ctx: ShopContext, body: Record<string, unknown>) {
  const prompt = String(body.prompt || "");
  if (!prompt) return { success: false, error: "Prompt is required" };

  try {
    const ai = ctx.getGemini();
    const productId = String(body.productId || "");
    const product = ctx.state.products.find((p) => p.id === productId);
    const parts: unknown[] = [{ text: prompt }];
    if (product?.image) {
      try {
        const res = await fetch(product.image);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          parts.unshift({
            inlineData: {
              mimeType: res.headers.get("content-type") || "image/jpeg",
              data: b64,
            },
          });
        }
      } catch {
        /* optional reference image */
      }
    }

    const aiRes = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    const candidates = aiRes.candidates || [];
    for (const c of candidates) {
      for (const part of c.content?.parts || []) {
        if (part.inlineData?.data) {
          return {
            success: true,
            imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
          };
        }
      }
    }
    return { success: false, error: "No image generated" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function omnichannelBase(): string {
  return Deno.env.get("OMNICHANNEL_URL") || "http://localhost:8000";
}

async function handleMessengerStatus() {
  const base = omnichannelBase();
  try {
    const res = await fetch(`${base}/messenger/status`);
    if (res.ok) return await res.json();
    return { connected: false, pages: [], error: `Backend returned ${res.status}` };
  } catch (e) {
    return {
      connected: false,
      pages: [],
      error: `Cannot reach Omnichannel backend at ${base}. Start uvicorn app.main:app --reload`,
    };
  }
}

async function handleMessengerAuthUrl() {
  const base = omnichannelBase();
  try {
    const res = await fetch(`${base}/messenger/auth-url`);
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Auth URL failed (${res.status})` };
    }
    return await res.json();
  } catch {
    return {
      error: `Cannot reach Omnichannel backend at ${base}. Run: uvicorn app.main:app --reload --port 8000`,
    };
  }
}

async function handleMessengerConnectPage(ctx: ShopContext, body: Record<string, unknown>) {
  const base = omnichannelBase();
  const pageId = String(body.pageId || body.page_id || "");
  const res = await fetch(`${base}/messenger/connect-page`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_id: pageId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: (err as { error?: string }).error || "Failed to connect page" };
  }
  const data = (await res.json()) as { page_id?: string; page_name?: string };
  ctx.state.config.messengerBotId = data.page_id || pageId;
  ctx.state.config.messengerBotName = data.page_name || ctx.state.config.messengerBotName || "";
  await ctx.save();
  return { success: true, config: ctx.state.config };
}

async function handleMessengerDisconnect(ctx: ShopContext) {
  const base = omnichannelBase();
  await fetch(`${base}/messenger/disconnect`, { method: "POST" }).catch(() => null);
  ctx.state.config.messengerBotId = "";
  ctx.state.config.messengerBotName = "";
  await ctx.save();
  return { success: true, config: ctx.state.config };
}
