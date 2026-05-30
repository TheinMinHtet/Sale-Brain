/**
 * Quick Integration Examples for ToolChat
 * 
 * Choose one of these approaches to add the tool-based chat to your app
 */

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 1: Add as a new route (recommended for testing)
// ═══════════════════════════════════════════════════════════════════════════

import { ToolChatDemo } from "./pages/ToolChatDemo";

// In your router configuration:
<Routes>
  {/* ... existing routes ... */}
  <Route path="/ai-chat" element={<ToolChatDemo />} />
</Routes>

// Add navigation link:
<nav>
  <Link to="/ai-chat">AI Assistant</Link>
</nav>


// ═══════════════════════════════════════════════════════════════════════════
// OPTION 2: Add as floating widget (global access)
// ═══════════════════════════════════════════════════════════════════════════

import { ToolChat } from "./components/ToolChat";

function App() {
  return (
    <>
      {/* Your existing app content */}
      <YourExistingComponents />
      
      {/* Floating chat widget - appears on all pages */}
      <ToolChat />
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// OPTION 3: Replace ShopChatbot in PublicShop page
// ═══════════════════════════════════════════════════════════════════════════

// Before:
import { ShopChatbot } from "./components/ShopChatbot";

<ShopChatbot
  shopId={shopId}
  businessName={shopData.config.shopName}
  products={shopData.products}
  suggestedPrompts={["What products do you sell?", "Tell me about delivery"]}
/>

// After:
import { ToolChat } from "./components/ToolChat";

<ToolChat fullPage />


// ═══════════════════════════════════════════════════════════════════════════
// OPTION 4: Add to dashboard as admin tool
// ═══════════════════════════════════════════════════════════════════════════

import { ToolChat } from "./components/ToolChat";

function Dashboard() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAI(!showAI)}>
        {showAI ? "Hide" : "Show"} AI Assistant
      </button>

      {showAI && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="mx-auto mt-8 h-[calc(100vh-4rem)] max-w-4xl">
            <ToolChat fullPage />
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// OPTION 5: Conditional rendering (show different chat based on context)
// ═══════════════════════════════════════════════════════════════════════════

import { ShopChatbot } from "./components/ShopChatbot";
import { ToolChat } from "./components/ToolChat";

function PublicShop({ shopId, isAdmin }: Props) {
  return (
    <>
      {isAdmin ? (
        // Admin sees tool-based chat with access to all data
        <ToolChat fullPage />
      ) : (
        // Customers see shop-specific sales chat
        <ShopChatbot
          shopId={shopId}
          businessName={shopData.config.shopName}
          products={shopData.products}
        />
      )}
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// TESTING LOCALLY
// ═══════════════════════════════════════════════════════════════════════════

// 1. Deploy the Edge Function:
//    supabase functions deploy chat-with-tools

// 2. Test with CLI:
//    node test-tool-chat.cjs "Show me all shops"

// 3. Test in browser:
//    Navigate to http://localhost:3000/ai-chat (if using Option 1)

// 4. Try these prompts:
//    - "Show me all shops"
//    - "What products are available?"
//    - "Tell me about shop features"
//    - "How does Sales Brain AI work?"


// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMIZATION: Add shop context to tool chat
// ═══════════════════════════════════════════════════════════════════════════

// Modify ToolChat.tsx to accept initial context:

interface ToolChatProps {
  fullPage?: boolean;
  initialContext?: {
    shopId?: string;
    shopName?: string;
  };
}

export function ToolChat({ fullPage = false, initialContext }: ToolChatProps) {
  // ... existing code ...

  async function sendMessage(text: string) {
    // ... existing code ...

    const { data, error } = await supabase.functions.invoke("chat-with-tools", {
      body: { 
        messages: newMessages,
        context: initialContext // Pass context to Edge Function
      }
    });

    // ... rest of code ...
  }
}

// Then use it:
<ToolChat 
  fullPage 
  initialContext={{ 
    shopId: currentShopId, 
    shopName: currentShopName 
  }} 
/>


// ═══════════════════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Key Differences:
 * 
 * ShopChatbot:
 * - Customer-facing sales assistant
 * - Single shop context
 * - Cart management
 * - Myanmar language support
 * - Conversation state machine
 * 
 * ToolChat:
 * - General AI assistant
 * - Multi-shop data access
 * - Real-time Supabase queries
 * - Tool-based architecture
 * - English only (easily extendable)
 * 
 * Use Cases:
 * - ShopChatbot: Public shop pages for customers
 * - ToolChat: Admin dashboard, data exploration, general queries
 */
