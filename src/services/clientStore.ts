import { cloneDefaultState, DEFAULT_STATE } from "../data/defaultState";
import type { Product, ShopConfig, SystemState, DeliveryZone, DeliveryZoneFormData } from "../types";
import { processCustomerMessage } from "./botSimulator";
import { getMarketingImageUrl, getMarketingInsights, getStrategyBriefing } from "./fallbackAi";
import { invokeApi } from "./api";

const STORAGE_KEY = "sales_brain_state_v1";

let memoryState: SystemState | null = null;

function load(): SystemState {
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryState = { ...cloneDefaultState(), ...JSON.parse(raw) };
      
      // Initialize deliveryZones if empty and it's a new load
      if (!memoryState.deliveryZones || memoryState.deliveryZones.length === 0) {
        memoryState.deliveryZones = [
          { id: "d1", township_name: "Yankin", rate: 2000, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
          { id: "d2", township_name: "Tamwe", rate: 2500, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
          { id: "d3", township_name: "North Dagon", rate: 3000, estimated_transit_timeline: "2-3 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
        ];
        save();
      }
      
      return memoryState;
    }
  } catch {
    /* ignore */
  }
  memoryState = cloneDefaultState();
  
  // Seed default delivery zones for the very first time
  memoryState.deliveryZones = [
    { id: "d1", township_name: "Yankin", rate: 2000, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
    { id: "d2", township_name: "Tamwe", rate: 2500, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
    { id: "d3", township_name: "North Dagon", rate: 3000, estimated_transit_timeline: "2-3 Days", region: "Yangon", division: "Yangon", created_at: new Date().toISOString() },
  ];
  
  save();
  return memoryState;
}

function save() {
  if (!memoryState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch (e) {
    console.warn("Could not persist state to localStorage", e);
  }
}

export function getState(): SystemState {
  return load();
}

export function resetState(): SystemState {
  memoryState = cloneDefaultState();
  save();
  return memoryState;
}

export function saveOnboarding(config: Partial<ShopConfig>) {
  const state = load();
  state.config = {
    ...state.config,
    shopName: config.shopName ?? state.config.shopName,
    ownerName: config.ownerName ?? state.config.ownerName,
    phone: config.phone ?? state.config.phone,
    telegramBotToken: config.telegramBotToken ?? state.config.telegramBotToken,
    telegramBotUsername: config.telegramBotUsername ?? state.config.telegramBotUsername,
    onboardingCompleted: config.onboardingCompleted ?? true,
    currency: "MMK",
  };
  save();
  return { success: true, config: state.config };
}

export function mutateProducts(action: string, product: Partial<Product> & { id?: string }) {
  const state = load();
  if (action === "add") {
    state.products.push({
      id: `prod-${Date.now()}`,
      name: product.name || "New Product",
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      description: product.description || "",
      image:
        product.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
      varies: product.varies || [],
    });
  } else if (action === "edit" && product.id) {
    state.products = state.products.map((p) =>
      p.id === product.id
        ? {
            ...p,
            ...product,
            price: Number(product.price) ?? p.price,
            stock: Number(product.stock) ?? p.stock,
          }
        : p
    );
  } else if (action === "delete" && product.id) {
    state.products = state.products.filter((p) => p.id !== product.id);
  }
  save();
  return state;
}

export function mutateDeliveryZone(
  action: string,
  payload: { zone?: DeliveryZoneFormData; id?: string }
) {
  const state = load();
  if (action === "add" && payload.zone) {
    state.deliveryZones.unshift({
      ...payload.zone,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    });
  } else if (action === "delete" && payload.id) {
    state.deliveryZones = state.deliveryZones.filter((z) => z.id !== payload.id);
  } else if (action === "update" && payload.id && payload.zone) {
    state.deliveryZones = state.deliveryZones.map((z) =>
      z.id === payload.id ? { ...z, ...payload.zone } : z
    );
  }
  save();
  return state;
}

export function updateOrderStatus(orderId: string, status: "confirmed" | "cancelled" | "completed") {
  const state = load();
  const order = state.orders.find((o) => o.id === orderId);
  if (order) order.status = status;
  save();
  return state;
}

export function botTakeover(sessionId: string) {
  const state = load();
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].liveTakeoverActive = true;
    state.sessions[sessionId].messages.push({
      id: `sys-${Date.now()}`,
      sender: "system",
      content: "Owner has taken over this chat.",
      timestamp: new Date().toISOString(),
    });
  }
  save();
  return { success: true };
}

export function botRelease(sessionId: string) {
  const state = load();
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].liveTakeoverActive = false;
    state.sessions[sessionId].messages.push({
      id: `sys-${Date.now()}`,
      sender: "system",
      content: "AI assistant Candy is active again.",
      timestamp: new Date().toISOString(),
    });
  }
  save();
  return { success: true };
}

export function botOwnerReply(sessionId: string, content: string) {
  const state = load();
  const session = state.sessions[sessionId];
  if (session) {
    session.messages.push({
      id: `mo-${Date.now()}`,
      sender: "owner",
      content,
      timestamp: new Date().toISOString(),
    });
  }
  save();
  return { success: true };
}

export function botSimulateInput(body: {
  sessionId: string;
  content?: string;
  base64Image?: string;
  transactionId?: string;
  township?: string;
  payMethod?: string;
  checkoutOption?: string;
}) {
  const state = load();
  const result = processCustomerMessage(state, body.sessionId, body);
  save();
  return result;
}

export async function getAiStrategy(lang: "en" | "my") {
  try {
    const data = await invokeApi<{ strategy: string }>("ai/strategy", { lang });
    if (data.strategy) return { success: true, strategy: data.strategy };
  } catch (err) {
    console.warn("AI Strategy API failed, using fallback:", err);
  }
  const state = load();
  return { success: true, strategy: getStrategyBriefing(state, lang) };
}

export async function getAiMarketingInsights(campaignType: string, productIds: string[]) {
  try {
    const data = await invokeApi<{ insights: any }>("ai/marketing/insights", { campaignType, productIds });
    if (data.insights) return { success: true, insights: data.insights };
  } catch (err) {
    console.warn("AI Marketing Insights API failed, using fallback:", err);
  }
  const state = load();
  return { success: true, insights: getMarketingInsights(state, campaignType, productIds) };
}

export async function getAiMarketingImage(campaignType: string, prompt?: string) {
  try {
    const data = await invokeApi<{ imageUrl: string }>("ai/marketing/image", { prompt: prompt || `Professional marketing poster for ${campaignType}` });
    if (data.imageUrl) return { success: true, imageUrl: data.imageUrl };
  } catch (err) {
    console.warn("AI Marketing Image API failed, using fallback:", err);
  }
  return {
    success: true,
    imageUrl: getMarketingImageUrl(campaignType),
  };
}

/** Seed export for tests */
export { DEFAULT_STATE };
