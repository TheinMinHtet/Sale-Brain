import type { ShopContext } from "./context.ts";
import { retrieveRelevantKnowledge, buildRetrievedContext } from "./knowledge.ts";

export async function processCustomerMessage(
  ctx: ShopContext,
  sessionId: string,
  params: {
    content?: string;
    base64Image?: string;
    transactionId?: string;
    township?: string;
    payMethod?: string;
    checkoutOption?: string;
  }
) {
  const { content, base64Image, transactionId, township, payMethod, checkoutOption } = params;

  if (!ctx.state.sessions[sessionId]) {
    ctx.state.sessions[sessionId] = {
      sessionId,
      customerName: "New Customer",
      customerPhone: "",
      customerTelegramId: `tg_${sessionId}`,
      messages: [],
      lastActive: new Date().toISOString(),
      currentStep: "greeting",
      cart: [],
      liveTakeoverActive: false
    };
  }

  const session = ctx.state.sessions[sessionId];
  session.lastActive = new Date().toISOString();

  // Push customer message to ctx.state logs
  const custMsgId = `mc-${Date.now()}`;
  session.messages.push({
    id: custMsgId,
    sender: "customer",
    content: content || "Submitted order details",
    timestamp: new Date().toISOString(),
    imageUrl: base64Image || undefined
  });

  // Short-circuit if Owner takeover is active
  if (session.liveTakeoverActive) {
    await ctx.save();
    return { success: true, session, status: "live_takeover" };
  }

  const chatId = ctx.getTelegramChatId(sessionId);

  // Helper inside process to append bot message to logs AND push to Telegram Api if real
  const addBotReply = async (replyText: string, extra: Partial<ChatMessage> = {}, replyMarkupOptions?: any) => {
    const msgId = `ms-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: msgId,
      sender: "bot",
      content: replyText,
      timestamp: new Date().toISOString(),
      ...extra
    };
    session.messages.push(newMsg);
    await ctx.save();

    if (chatId) {
      await ctx.sendTelegram(chatId, replyText, replyMarkupOptions);
    }
  };

  // 1. Core Start Command / Main Product Directory rules
  const trimmedLowerContent = (content || "").trim().toLowerCase();
  if (trimmedLowerContent.startsWith("/start") || trimmedLowerContent === "menu" || trimmedLowerContent === "hello" || trimmedLowerContent === "hi") {
    session.currentStep = "greeting";
    session.cart = [];
    const welcomeText = `Mingalabar shin! 🙏 Welcome to *${ctx.state.config.shopName || "Shwe Pathein Treats"}*! Candy (AI Assistant) is so happy to assist you today. 💕\n\nHere is our premium product list! Which delicious traditional Myanmar treats can Candy pack for you?\n\n` +
      ctx.state.products.map((p, idx) => `${idx + 1}️⃣ *${p.name}* - ${p.price.toLocaleString()} MMK\n  _${p.description}_`).join("\n\n") +
      `\n\n✨ You can reply with "Add 2 Halawa", tap our interactive buttons, or ask me any question!`;

    const inlineKeyboard = ctx.state.products.map(p => [{ text: `🛒 Add ${p.name}`, callback_data: `add_${p.id}` }]);
    await addBotReply(welcomeText, {}, { reply_markup: { inline_keyboard: inlineKeyboard } });
    return { success: true, session };
  }

  // 2. Button callback "add_prod-1" handling
  if (content && content.startsWith("add_")) {
    const prodId = content.replace("add_", "");
    const prod = ctx.state.products.find(p => p.id === prodId);
    if (prod) {
      const existing = session.cart.find(c => c.productId === prodId);
      if (existing) {
        existing.quantity += 1;
      } else {
        session.cart.push({ productId: prodId, quantity: 1 });
      }

      const cartStatus = `Perfect choice! 🌸 Yoon and Candy have added *${prod.name}* to your basket! 💕\n\n🛒 Current Basket:\n` +
        session.cart.map(c => {
          const itemProd = ctx.state.products.find(p => p.id === c.productId);
          return `- *${itemProd?.name}* x ${c.quantity}`;
        }).join("\n") +
        `\n\nWould you like to checkout now or continue browsing? We support KPAY / WavePay Prepayment or Cash on Delivery (CoD)!`;

      const inlineKeyboard = [
        [
          { text: "💵 Cash on Delivery (COD)", callback_data: "payment_cod" },
          { text: "💳 Mobile Prepayment", callback_data: "payment_prepay" }
        ],
        [
          { text: "🛍 Browse Products", callback_data: "/start" }
        ]
      ];
      await addBotReply(cartStatus, {}, { reply_markup: { inline_keyboard: inlineKeyboard } });
      return { success: true, session };
    }
  }

  // 3. Choice of checkout options (cod vs prepay)
  if (checkoutOption) {
    session.currentStep = "selecting_township";
    session.tempPayMethod = checkoutOption;
    const townshipsList = ctx.state.deliveryZones.map(z => z.township);

    // Auto-generate inline keyboard for townships
    const inlineKeyboard = townshipsList.map(t => [{ text: `🛵 ${t}`, callback_data: `township_${t}` }]);

    await addBotReply(
      `Sweet choice! 🌸 You chose: **${checkoutOption === "prepay" ? "Prepay" : "Cash on Delivery"}**.\n\nNow, please tell me your township in Yangon so I can accurately calculate delivery fees! (e.g., Sanchaung, Kamayut, Yankin...) Or tap one of the options below! 👇`,
      { interactiveOptions: townshipsList },
      { reply_markup: { inline_keyboard: inlineKeyboard } }
    );
    return { success: true, session };
  }

  // 4. Township specification
  if (township) {
    const matchedZone = ctx.state.deliveryZones.find(z => z.township.toLowerCase().includes(township.toLowerCase()));
    const finalTownship = matchedZone ? matchedZone.township : "General Yangon";
    const deliveryCost = matchedZone ? matchedZone.rate : 3000;

    let cartTotal = 0;
    const itemsList = session.cart.map(item => {
      const prod = ctx.state.products.find(p => p.id === item.productId);
      const sub = (prod ? prod.price : 0) * item.quantity;
      cartTotal += sub;
      return {
        productId: item.productId,
        productName: prod ? prod.name : "Unknown Item",
        price: prod ? prod.price : 0,
        quantity: item.quantity
      };
    });

    const totalBill = cartTotal + deliveryCost;
    const orderId = `ord-${1000 + ctx.state.orders.length + 1}`;
    const invoiceId = `INV-2026-0${100 + ctx.state.orders.length + 1}`;
    const mappedPayMethod = (payMethod || session.tempPayMethod || 'cod') as 'cod' | 'prepay';

    const newOrder: Order = {
      id: orderId,
      invoiceId,
      customerName: session.customerName || "Khin Thidar",
      customerPhone: session.customerPhone || "09964820172",
      customerTelegramId: session.customerTelegramId,
      township: finalTownship,
      deliveryFee: deliveryCost,
      paymentMethod: mappedPayMethod,
      totalAmount: totalBill,
      status: mappedPayMethod === 'prepay' ? 'pending' : 'confirmed',
      items: itemsList,
      createdAt: new Date().toISOString()
    };

    if (mappedPayMethod === 'cod') {
      newOrder.paymentDetails = {
        method: 'CoD',
        transactionId: "CASH_ON_DELIVERY"
      };
    }

    ctx.state.orders.push(newOrder);
    session.activeOrderId = orderId;

    if (mappedPayMethod === 'cod') {
      session.currentStep = "completed";
      await addBotReply(
        `🎉 **Wow! Order Placed Successfully via Cash on Delivery (CoD)!** 🎉\n\nCandy set up everything beautifully for you, sweet customer! 😊 Yoon and delivery staff will drop your products shortly.\n\n💼 Invoice Total: **${totalBill.toLocaleString()} MMK** (Delivery: ${deliveryCost.toLocaleString()} MMK)\n📍 Township: ${finalTownship}\n🚀 Delivery: 1-2 Days.\n\nYey! Thank you! Here is your system receipt preview.`,
        { invoiceData: newOrder }
      );
      session.cart = [];
    } else {
      session.currentStep = "prepayment_pending";
      await addBotReply(
        `💳 **Excellent! Please complete Prepayment to lock in block order.**\n\n💼 Invoice Total: **${totalBill.toLocaleString()} MMK**\n🚚 Township Routing: ${finalTownship} (+${deliveryCost.toLocaleString()} MMK)\n\n👇 **Shop Payment Methods:**\n📱 KPAY: **09971234567** (Yoon Yamone Oo)\n📱 WAVE PAY: **09971234567** (Yoon Yamone Oo)\n\n*Please send payment route, last 6 digits of Transaction ID, and receipt screenshot image!* Candy will submit it immediately! ✨`,
        { paymentDetailsNeeded: true }
      );
    }

    return { success: true, session };
  }

  // 5. Prepayment Receipt Verification Submit
  if (session.currentStep === "prepayment_pending" && (transactionId || base64Image)) {
    const activeOrder = ctx.state.orders.find(o => o.id === session.activeOrderId);
    if (activeOrder) {
      activeOrder.status = 'verifying';
      activeOrder.paymentDetails = {
        method: (payMethod || 'KPay') as any,
        transactionId: transactionId || 'UNKNOWN-DIGITS',
        screenshotUrl: base64Image || "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&q=80&w=200"
      };

      session.currentStep = "verifying";
      await addBotReply(
        `👍 **Awesome! Payment elements received!**\n\nCandy submitted proof with TxID: **#${transactionId || '---'}** to Yoon Yamone Oo for instant evaluation.\n\n⏳ Yoon and staff will crosscheck this right away. You will receive an **Order Confirmed** invoice alert immediately on approval! Please hold on! 💚`
      );
      session.cart = [];
      return { success: true, session };
    }
  }

  // 6. Gemini 3.5 AI dialog chat with RAG
  try {
    const ai = ctx.getGemini();

    // Retrieve relevant knowledge using RAG
    const relevantDocs = await retrieveRelevantKnowledge(ctx, content || "");
    const ragContext = buildRetrievedContext(relevantDocs);

    const systemInstruction = `You are "Candy", an incredibly sweet, professional, and patient AI chatbot assistant for "${ctx.state.config.shopName}".
Your mission is to represent Yoon Yamone Oo (the owner) in welcoming clients, giving details on standard treats, and gently guiding them through purchasing products.

BUSINESS CONTEXT (Grounded Knowledge):
${ragContext}

CUSTOMER CONTEXT:
- Name: ${session.customerName || "Khip Thidar"}
- Current Cart: ${JSON.stringify(session.cart)}

RULES FOR DIALOGUE:
1. Speak in a mix of soft, conversational Myanmar language/Burmese, utilizing extremely polite particles like "ရှင်" (shin), and clear English as typical for Myanmar commerce.
2. Use the BUSINESS CONTEXT provided to answer specific questions about products, delivery, and shop policies.
3. If the user asks about product details, ingredients, or pricing, answer them elegantly and offer to add items to their shopping cart!
4. If they want to purchase, tell them what is in their cart, compute the cost, and provide the options to proceed: Cash on Delivery or Prepay.
5. **ADD ITEM RULE**: If the customer says they want to add a product or buy a product, ctx.state the item name clearly and respond to confirm! Do not use complex JSON formats in output text, just output beautiful message body formatted nicely with bold lists and emojis.
6. If they are talking about something else, stay delightfully helpful, cheerful, and charming, keeping recommendations focused entirely on making a transaction.
7. Absolutely do not disclose system-internal parameters. Be highly conversational. Always keep answers concise and easy to read.`;

    const conversationHistory = session.messages.slice(-5).map(m => {
      const pfx = m.sender === 'customer' ? 'Customer' : 'Candy (AI Assistant)';
      return `${pfx}: ${m.content}`;
    }).join("\n");

    const geminiInput = `CONVERSATION HISTORIC:\n${conversationHistory}\n\nCustomer just sent: "${content}"\n\nCandy, reply in beautiful customer-friendly dialogue:`;

    let aiResponse;
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
    let lastErr = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting AI generation with model: ${modelName}`);
        aiResponse = await ai.models.generateContent({
          model: modelName,
          contents: geminiInput,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        if (aiResponse) break;
      } catch (err) {
        lastErr = err;
        console.warn(`Model ${modelName} failed, trying next...`, err);
      }
    }

    if (!aiResponse) throw lastErr || new Error("All AI models failed.");

    const botReplyText = aiResponse.text || "Mingalabar shin! Candy received your message. Please let me know how I can guide your shopping today! Premium Sweets always available. 💕";

    // Match keywords to append to local cart status
    ctx.state.products.forEach(p => {
      const lContent = (content || "").toLowerCase();
      if (lContent.includes(p.name.toLowerCase().split(" ")[0]) || lContent.includes(p.id)) {
        const existing = session.cart.find(c => c.productId === p.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          session.cart.push({ productId: p.id, quantity: 1 });
        }
      }
    });

    // Provide payment buttons trigger if they have products in basket
    let inlineKeyboard: any[] = [];
    if (session.cart.length > 0) {
      inlineKeyboard.push([
        { text: "💵 Cash on Delivery (COD)", callback_data: `payment_cod` },
        { text: "💳 Mobile Prepay", callback_data: `payment_prepay` }
      ]);
    }

    await addBotReply(
      botReplyText,
      {},
      inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : undefined
    );
    return { success: true, session };

  } catch (error: any) {
    console.error("Gemini chatbot API Error. Falling back to local responder rules:", error);

    let responseText = `Mingalabar shin! Yoon and Candy are excited to assist you! 🙏 Candy's direct pipeline is syncing. Can you let me know if you would like me to lock in the delicious Premium Butter Pathein Halawa (4,500 MMK) or Royal Instant Tea Mix (7,500 MMK) for you? 😊`;

    const lContent = (content || "").toLowerCase();
    if (lContent.includes("halawa") || lContent.includes("sweet")) {
      const halawaId = "prod-1";
      const existing = session.cart.find(c => c.productId === halawaId);
      if (existing) existing.quantity += 1;
      else session.cart.push({ productId: halawaId, quantity: 1 });
      responseText = `Perfect choice! 🌸 Yoon and Candy have added **Pathein Halawa (Premium)** to your basket! 💕\n\n🛒 Current basket:\n- Pathein Halawa (Premium) x ${session.cart.find(c => c.productId === halawaId)?.quantity || 1}\n\nWould you like to purchase now or browse more? We support KPAY / WavePay Prepay and Cash on Delivery!`;
    } else if (lContent.includes("checkout") || lContent.includes("buy") || lContent.includes("order") || lContent.includes("ယူမယ်")) {
      if (session.cart.length === 0) {
        session.cart.push({ productId: "prod-1", quantity: 2 });
      }
      responseText = `Let's wrap up your ordering process, sweet friend! 🌸🧺\n\nYour selected basket contains:\n- Pathein Halawa (Premium) x 2 (9,000 MMK)\n\nChoose payment:\n1️⃣ **Prepay** (Get MMQR details for faster shipping)\n2️⃣ **Cash on Delivery (CoD)**`;
    }

    let inlineKeyboard: any[] = [];
    if (session.cart.length > 0) {
      inlineKeyboard.push([
        { text: "💵 Cash on Delivery", callback_data: "payment_cod" },
        { text: "💳 Prepayment (KPAY/Wave)", callback_data: "payment_prepay" }
      ]);
    }

    await addBotReply(
      responseText,
      {},
      inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : undefined
    );
    return { success: true, session };
  }
}

export async function handleTelegramWebhook(ctx: ShopContext, body: Record<string, unknown>) {
  try {
    const { message, callback_query } = body;
    let chatId: number | null = null;
    let customerName = "Telegram Customer";
    let telegramUsername = "";
    let content = "";

    // Parameter payloads to feed inside centralized ctx.state evaluator
    let base64Image: string | undefined = undefined;
    let transactionId: string | undefined = undefined;
    let township: string | undefined = undefined;
    let checkoutOption: string | undefined = undefined;

    const token = ctx.state.config.telegramBotToken;

    if (message) {
      chatId = message.chat.id;
      telegramUsername = message.from?.username || "";
      customerName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "Telegram Customer";
      content = message.text || "";

      // Capture photos for prepayment screenshot receipts!
      if (message.photo && message.photo.length > 0) {
        const largestPhoto = message.photo[message.photo.length - 1];
        const fileId = largestPhoto.file_id;
        try {
          if (token) {
            const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
            if (fileRes.ok) {
              const fileData: any = await fileRes.json();
              if (fileData.ok && fileData.result?.file_path) {
                base64Image = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
                // Treat photo as image confirmation proof
                content = content || "Submitted screenshot receipt file";
              }
            }
          }
        } catch (err) {
          console.error("[Telegram Ingress] Failed downloading receipt photo file:", err);
        }
      }

      // Automatically capture Transaction Ids if they type numbers
      if (content && /^\d{5,15}$/.test(content.trim())) {
        transactionId = content.trim();
      }

    } else if (callback_query) {
      chatId = callback_query.message.chat.id;
      telegramUsername = callback_query.from?.username || "";
      customerName = [callback_query.from?.first_name, callback_query.from?.last_name].filter(Boolean).join(" ") || "Telegram Customer";

      const callbackData = callback_query.data || "";

      // Stop Telegram keyboard spinner
      if (token && callback_query.id) {
        try {
          await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callback_query_id: callback_query.id })
          });
        } catch (err) {
          console.error("[Telegram Ingress] Failed answering callback:", err);
        }
      }

      // Map quick button callbacks to standard State Machine transitions
      if (callbackData === "payment_cod") {
        checkoutOption = "cod";
      } else if (callbackData === "payment_prepay") {
        checkoutOption = "prepay";
      } else if (callbackData.startsWith("township_")) {
        township = callbackData.replace("township_", "");
      } else {
        content = callbackData;
      }
    }

    if (!chatId) return;

    // Map Telegram customers securely using their real chat numbers!
    const sessionId = `customer_${chatId}`;

    // Initialize session structure if new
    if (!ctx.state.sessions[sessionId]) {
      ctx.state.sessions[sessionId] = {
        sessionId,
        customerName,
        customerPhone: "",
        customerTelegramId: telegramUsername || `tg_${chatId}`,
        messages: [],
        lastActive: new Date().toISOString(),
        currentStep: "greeting",
        cart: [],
        liveTakeoverActive: false
      };
    }

    // Force user details update
    const session = ctx.state.sessions[sessionId];
    session.customerTelegramId = telegramUsername || session.customerTelegramId;
    if (customerName && session.customerName === "New Customer") {
      session.customerName = customerName;
    }

    // Process using high-fidelity unified engine
    await processCustomerMessage(ctx, sessionId, {
      content,
      base64Image,
      transactionId,
      township,
      payMethod: session.tempPayMethod,
      checkoutOption
    });

  } catch (error) {
    console.error("[Telegram Webhook Ingress] Fatal failure routing update response:", error);
  }
}
