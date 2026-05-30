import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tools = [
  {
    name: "get_shop_info",
    description: "Get detailed information about a specific shop including name, owner, phone, currency, and configuration. Use this when user asks about shop details, business info, or owner information.",
    parameters: {
      type: "object",
      properties: {
        shop_id: {
          type: "string",
          description: "The UUID or shop_id of the shop to fetch"
        }
      },
      required: ["shop_id"]
    }
  },
  {
    name: "get_products",
    description: "Get products from a shop. Can filter by shop_id, category, or search by name. Use this when user asks about products, inventory, pricing, or stock availability.",
    parameters: {
      type: "object",
      properties: {
        shop_id: {
          type: "string",
          description: "Filter products by shop UUID"
        },
        category: {
          type: "string",
          description: "Filter products by category"
        },
        search_name: {
          type: "string",
          description: "Search products by name (case-insensitive partial match)"
        }
      }
    }
  },
  {
    name: "list_all_shops",
    description: "List all shops in the database with basic information. Use this when user asks to see all shops, browse shops, or wants an overview of available businesses.",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

async function executeToolCall(toolName: string, args: Record<string, unknown>) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  if (toolName === "get_shop_info") {
    const { shop_id } = args;
    const { data, error } = await supabase
      .from("shops")
      .select("id, shop_id, shop_name, owner_name, phone, currency, address, role, onboarding_completed, created_at")
      .or(`id.eq.${shop_id},shop_id.eq.${shop_id}`)
      .single();

    if (error) return { error: error.message };
    return { shop: data };
  }

  if (toolName === "get_products") {
    const { shop_id, category, search_name } = args;
    let query = supabase
      .from("products")
      .select("id, name, category, price, description, stock, image, is_on_demand, waiting_time, about");

    if (shop_id) query = query.eq("shop_id", shop_id);
    if (category) query = query.eq("category", category);
    if (search_name) query = query.ilike("name", `%${search_name}%`);

    const { data, error } = await query.limit(50);
    if (error) return { error: error.message };
    return { products: data, count: data?.length || 0 };
  }

  if (toolName === "list_all_shops") {
    const { data, error } = await supabase
      .from("shops")
      .select("id, shop_id, shop_name, owner_name, phone, currency, onboarding_completed")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { error: error.message };
    return { shops: data, count: data?.length || 0 };
  }

  return { error: "Unknown tool" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);

  try {
    const { messages, model = "gemini-2.0-flash-exp" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse(req, { error: "messages array required" }, 400);
    }

    if (!GEMINI_API_KEY) {
      return jsonResponse(req, { error: "GEMINI_API_KEY not configured" }, 500);
    }

    // Initial Gemini call with tools
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          tools: [{ functionDeclarations: tools }],
          systemInstruction: {
            parts: [{
              text: `You are a helpful AI assistant for Sales Brain AI, a platform that helps Myanmar businesses sell via Telegram.

When users ask about shops or products, use the provided tools to fetch real data from the Supabase database.
When users ask general questions or chat casually, respond naturally without using tools.

Always respond in a friendly, professional manner. If data is not found, explain clearly and offer alternatives.`
            }]
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return jsonResponse(req, { error: error.error?.message || "Gemini API error" }, 500);
    }

    let result = await response.json();
    let candidate = result.candidates?.[0];

    // Handle function calls
    const functionCalls = candidate?.content?.parts?.filter((p: { functionCall?: unknown }) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];

      for (const fc of functionCalls) {
        const toolName = fc.functionCall.name;
        const toolArgs = fc.functionCall.args || {};
        const toolResult = await executeToolCall(toolName, toolArgs);

        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: toolResult
          }
        });
      }

      // Second Gemini call with function results
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...messages.map((m: { role: string; content: string }) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
              })),
              {
                role: "model",
                parts: functionCalls
              },
              {
                role: "user",
                parts: functionResponses
              }
            ],
            tools: [{ functionDeclarations: tools }]
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return jsonResponse(req, { error: error.error?.message || "Gemini API error" }, 500);
      }

      result = await response.json();
      candidate = result.candidates?.[0];
    }

    const reply = candidate?.content?.parts?.[0]?.text || "I couldn't generate a response.";

    return jsonResponse(req, {
      reply,
      usage: result.usageMetadata
    });

  } catch (e) {
    console.error("[chat-with-tools]", e);
    return jsonResponse(req, { error: String(e) }, 500);
  }
});
