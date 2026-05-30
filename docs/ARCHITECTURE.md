# Tool-Based Chat Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ToolChat Component (React)                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  • Message input                                          │  │    │
│  │  │  • Message history                                        │  │    │
│  │  │  • Loading states                                         │  │    │
│  │  │  • Suggested prompts                                      │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTP POST
                                   │ { messages: [...] }
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE EDGE FUNCTION                              │
│                    chat-with-tools/index.ts                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  1. Receive messages array                                     │    │
│  │  2. Prepare tool definitions                                   │    │
│  │  3. Call Gemini API with tools                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GEMINI API (Google)                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Analyzes user message:                                        │    │
│  │  • "Show me all shops" → Need list_all_shops()                │    │
│  │  • "What products?" → Need get_products()                     │    │
│  │  • "How does it work?" → No tool needed                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
         Tool Call Needed?                  No Tool Needed
                    │                             │
                    ▼                             ▼
┌─────────────────────────────────┐   ┌──────────────────────────┐
│  TOOL EXECUTION                 │   │  Direct Response         │
│  (Edge Function)                │   │  "Sales Brain AI is..."  │
│                                 │   └──────────────────────────┘
│  executeToolCall(name, args)    │              │
│         │                       │              │
│         ▼                       │              │
│  ┌──────────────────────────┐  │              │
│  │  get_shop_info()         │  │              │
│  │  • Query shops table     │  │              │
│  │  • Return shop details   │  │              │
│  └──────────────────────────┘  │              │
│         │                       │              │
│  ┌──────────────────────────┐  │              │
│  │  get_products()          │  │              │
│  │  • Query products table  │  │              │
│  │  • Filter by shop/cat    │  │              │
│  │  • Return product list   │  │              │
│  └──────────────────────────┘  │              │
│         │                       │              │
│  ┌──────────────────────────┐  │              │
│  │  list_all_shops()        │  │              │
│  │  • Query shops table     │  │              │
│  │  • Return all shops      │  │              │
│  └──────────────────────────┘  │              │
│         │                       │              │
│         ▼                       │              │
│  ┌──────────────────────────┐  │              │
│  │  SUPABASE DATABASE       │  │              │
│  │  • shops table           │  │              │
│  │  • products table        │  │              │
│  │  • orders table          │  │              │
│  └──────────────────────────┘  │              │
│         │                       │              │
│         ▼                       │              │
│  Return tool results            │              │
└─────────────┬───────────────────┘              │
              │                                  │
              ▼                                  │
┌─────────────────────────────────────────────┐ │
│  GEMINI API (Second Call)                   │ │
│  • Receives tool results                    │ │
│  • Generates natural language response      │ │
│  • "Here are the shops: Shop A, Shop B..." │ │
└─────────────┬───────────────────────────────┘ │
              │                                  │
              └──────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Edge Function Response      │
              │  { reply: "...", usage: {} } │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  ToolChat Component          │
              │  • Display assistant message │
              │  • Update UI                 │
              └──────────────────────────────┘
```

## Tool Decision Tree

```
User Message
     │
     ▼
┌─────────────────────────────────────────────┐
│ Gemini analyzes intent                      │
└─────────────────────────────────────────────┘
     │
     ├─── Contains "shop" + "all/list" ────────────► list_all_shops()
     │
     ├─── Contains "shop" + specific name ─────────► get_shop_info(shop_id)
     │
     ├─── Contains "product" + shop context ───────► get_products(shop_id)
     │
     ├─── Contains "product" + category ───────────► get_products(category=X)
     │
     ├─── Contains "product" + search term ────────► get_products(search_name=X)
     │
     └─── General question/chat ───────────────────► Direct response (no tool)
```

## Data Flow Example: "Show me all shops"

```
Step 1: User Input
┌──────────────────────────────────┐
│ User: "Show me all shops"        │
└──────────────────────────────────┘
         │
         ▼
Step 2: Edge Function receives request
┌──────────────────────────────────┐
│ POST /functions/v1/chat-with-tools│
│ Body: {                          │
│   messages: [                    │
│     {role: "user",               │
│      content: "Show me all shops"}│
│   ]                              │
│ }                                │
└──────────────────────────────────┘
         │
         ▼
Step 3: First Gemini call (with tools)
┌──────────────────────────────────┐
│ Gemini analyzes:                 │
│ "User wants to see all shops"    │
│ → I need list_all_shops() tool   │
└──────────────────────────────────┘
         │
         ▼
Step 4: Execute tool
┌──────────────────────────────────┐
│ executeToolCall("list_all_shops")│
│   ↓                              │
│ SELECT * FROM shops              │
│ ORDER BY created_at DESC         │
│ LIMIT 100                        │
│   ↓                              │
│ Returns: {                       │
│   shops: [                       │
│     {id: "...", name: "Shop A"}, │
│     {id: "...", name: "Shop B"}  │
│   ],                             │
│   count: 2                       │
│ }                                │
└──────────────────────────────────┘
         │
         ▼
Step 5: Second Gemini call (with results)
┌──────────────────────────────────┐
│ Gemini receives tool results     │
│ Generates natural response:      │
│ "I found 2 shops in the database:│
│  1. Shop A - owned by John       │
│  2. Shop B - owned by Mary       │
│  Would you like details on any?" │
└──────────────────────────────────┘
         │
         ▼
Step 6: Return to client
┌──────────────────────────────────┐
│ Response: {                      │
│   reply: "I found 2 shops...",   │
│   usage: {                       │
│     totalTokenCount: 245         │
│   }                              │
│ }                                │
└──────────────────────────────────┘
         │
         ▼
Step 7: Display in UI
┌──────────────────────────────────┐
│ 🤖 Assistant:                    │
│ I found 2 shops in the database: │
│ 1. Shop A - owned by John        │
│ 2. Shop B - owned by Mary        │
│ Would you like details on any?   │
└──────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
  │
  ├─ Routes
  │   ├─ /ai-chat → ToolChatDemo
  │   │              └─ ToolChat (fullPage=true)
  │   │
  │   └─ /shop/:id → PublicShop
  │                   └─ ShopChatbot (shop-specific)
  │
  └─ ToolChat (floating widget, optional)
```

## File Structure

```
Sale-Brain/
│
├── supabase/
│   └── functions/
│       ├── chat-with-tools/
│       │   └── index.ts ..................... Edge Function (tool execution)
│       └── _shared/
│           └── cors.ts ...................... CORS helpers
│
├── src/
│   ├── components/
│   │   ├── ToolChat.tsx .................... Chat UI component
│   │   └── ShopChatbot.tsx ................. Shop-specific chat (existing)
│   │
│   ├── pages/
│   │   └── ToolChatDemo.tsx ................ Full-page demo
│   │
│   └── utils/
│       └── supabase.ts ..................... Supabase client
│
├── docs/
│   ├── TOOL_CHAT.md ........................ Full documentation
│   ├── TOOL_CHAT_SUMMARY.md ................ Quick summary
│   ├── INTEGRATION_EXAMPLES.tsx ............ Code examples
│   └── ARCHITECTURE.md ..................... This file
│
└── test-tool-chat.cjs ...................... CLI test script
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  • Has SUPABASE_ANON_KEY                                    │
│  • Can only call Edge Functions                             │
│  • Cannot directly access database                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Authenticated request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION (Supabase)                        │
│  • Has SUPABASE_SERVICE_ROLE_KEY                            │
│  • Has GEMINI_API_KEY                                       │
│  • Can bypass RLS (Row Level Security)                      │
│  • Validates requests                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Service role queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE DATABASE                            │
│  • shops table (RLS enabled)                                │
│  • products table (RLS disabled ⚠️)                         │
│  • orders table (RLS enabled)                               │
└─────────────────────────────────────────────────────────────┘

⚠️ SECURITY NOTE:
Products table has RLS disabled. Enable before production:
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

## Performance Characteristics

```
Request Timeline:
│
├─ 0ms ─────── User sends message
│
├─ 50ms ────── Edge Function receives request
│
├─ 100ms ───── First Gemini API call starts
│
├─ 600ms ───── Gemini responds with tool call
│
├─ 650ms ───── Tool execution (Supabase query)
│
├─ 850ms ───── Tool results ready
│
├─ 900ms ───── Second Gemini API call starts
│
├─ 1500ms ──── Gemini generates final response
│
└─ 1550ms ──── Response displayed to user

Total: ~1.5 seconds (with tool call)
       ~0.6 seconds (without tool call)
```

---

**Last Updated:** 2026-05-30  
**Version:** 1.0.0
