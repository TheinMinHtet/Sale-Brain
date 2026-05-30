# Tool-Based Chat with Supabase Integration

## Overview

This feature implements a Gemini-powered chat assistant that intelligently fetches shop and product data from Supabase using **function calling** (tool use). When users ask about shops or products, the AI automatically calls the appropriate tools to retrieve real data. For general questions, it responds naturally without database queries.

## Architecture

```
User Question
     ↓
Gemini API (with tools)
     ↓
Tool Call Detected? ──No──→ Direct Response
     ↓ Yes
Execute Tool (Supabase Query)
     ↓
Gemini API (with tool results)
     ↓
Final Response
```

## Files Created

### 1. Edge Function: `supabase/functions/chat-with-tools/index.ts`

**Purpose:** Handles chat requests with Gemini function calling

**Tools Available:**
- `get_shop_info(shop_id)` — Fetch shop details
- `get_products(shop_id?, category?, search_name?)` — Query products with filters
- `list_all_shops()` — List all shops in database

**Flow:**
1. Receives messages array from client
2. Calls Gemini API with tool definitions
3. If Gemini requests a tool, executes Supabase query
4. Sends tool results back to Gemini
5. Returns final response to client

### 2. React Component: `src/components/ToolChat.tsx`

**Purpose:** Chat UI that invokes the Edge Function

**Features:**
- Auto-scrolling message list
- Auto-resizing textarea
- Loading states
- Suggested prompts
- Full-page or floating widget modes

### 3. Demo Page: `src/pages/ToolChatDemo.tsx`

**Purpose:** Full-page demo of the tool-based chat

## Deployment

### 1. Deploy Edge Function

```bash
supabase functions deploy chat-with-tools
```

### 2. Set Environment Variables

Ensure these secrets are set in Supabase:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/chat-with-tools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me all shops"}
    ]
  }'
```

## Usage Examples

### Example 1: Shop Query
```
User: "Show me all shops"
AI: [Calls list_all_shops() tool]
AI: "Here are the shops in the database: ..."
```

### Example 2: Product Search
```
User: "What products does shop X sell?"
AI: [Calls get_products(shop_id="X") tool]
AI: "Shop X has the following products: ..."
```

### Example 3: General Question
```
User: "How does Sales Brain AI work?"
AI: [No tool call needed]
AI: "Sales Brain AI is a platform that helps Myanmar businesses..."
```

## Integration with Existing App

### Option 1: Replace ShopChatbot

In `src/App.tsx`:

```typescript
import { ToolChat } from "./components/ToolChat";

// Replace <ShopChatbot /> with:
<ToolChat />
```

### Option 2: Add as Separate Route

```typescript
import { ToolChatDemo } from "./pages/ToolChatDemo";

// Add route in your router
<Route path="/tool-chat" element={<ToolChatDemo />} />
```

### Option 3: Use as Floating Widget

```typescript
import { ToolChat } from "./components/ToolChat";

// Add anywhere in your app
<ToolChat fullPage={false} />
```

## Security Considerations

⚠️ **Row Level Security (RLS) Warning:**

The `products` and `User` tables currently have RLS disabled. This means:
- Anyone with the anon key can read/modify all rows
- The Edge Function uses service role key to bypass RLS

**Recommended Actions:**

1. Enable RLS on products table:
```sql
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view products"
ON public.products FOR SELECT
TO public
USING (true);

-- Only shop owners can modify their products
CREATE POLICY "Owners can manage products"
ON public.products FOR ALL
TO authenticated
USING (owner_id = auth.uid());
```

2. Enable RLS on User table:
```sql
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
ON public."User" FOR SELECT
TO authenticated
USING (id = auth.uid()::text);
```

## Customization

### Add New Tools

Edit `supabase/functions/chat-with-tools/index.ts`:

```typescript
const tools = [
  // ... existing tools
  {
    name: "get_orders",
    description: "Get orders for a shop",
    parameters: {
      type: "object",
      properties: {
        shop_id: { type: "string" },
        status: { type: "string" }
      },
      required: ["shop_id"]
    }
  }
];

// Add handler in executeToolCall()
if (toolName === "get_orders") {
  const { shop_id, status } = args;
  let query = supabase.from("orders").select("*").eq("shop_id", shop_id);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  return { orders: data };
}
```

### Customize System Prompt

Edit the `systemInstruction` in the Edge Function:

```typescript
systemInstruction: {
  parts: [{
    text: `Your custom instructions here...`
  }]
}
```

## Troubleshooting

### Issue: "GEMINI_API_KEY not configured"
**Solution:** Set the secret in Supabase dashboard or CLI

### Issue: Tool calls not working
**Solution:** Check Gemini model supports function calling (use `gemini-2.0-flash-exp` or `gemini-1.5-pro`)

### Issue: Empty responses
**Solution:** Check Edge Function logs: `supabase functions logs chat-with-tools`

### Issue: CORS errors
**Solution:** Ensure `_shared/cors.ts` is properly configured

## Performance

- **Cold start:** ~2-3 seconds (Edge Function initialization)
- **Warm requests:** ~500-800ms (Gemini API latency)
- **With tool calls:** +200-400ms (Supabase query time)

## Future Enhancements

- [ ] Add caching for frequently accessed data
- [ ] Implement streaming responses
- [ ] Add conversation memory (store in sessions table)
- [ ] Support multi-turn tool calls
- [ ] Add analytics tracking
- [ ] Implement rate limiting

---

**Last Updated:** 2026-05-30  
**Status:** ✅ Ready for testing
