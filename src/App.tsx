import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash,
  Trash2,
  ShoppingBag,
  Check,
  Image,
  X,
  MessageSquare,
  Settings,
  Database,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  UserCheck,
  Bell,
  Truck,
  Info,
  Coins,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Languages,
  Send,
  Copy
} from "lucide-react";

import { CustomChart } from "./components/CustomChart";
import { TelegramSimulator } from "./components/TelegramSimulator";
import { SmartMarketing } from "./components/SmartMarketing";
import { Onboarding } from "./components/Onboarding";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { PublicShop } from "./components/PublicShop";
import { useAuth } from "./contexts/AuthContext";
import { invokeApi } from "./services/api";
import { getShopState, saveShopState } from "./services/shopState";
import {
  emptyOnboardingForm,
  getShopForOwner,
  shopRecordToFormData,
} from "./services/shopRecord";
import { getProducts, migrateProductsFromJson, upsertProduct, deleteProduct } from "./services/productService";
import type { OnboardingFormState, ShopRecord } from "./types";
import { Product, DeliveryZone, Order, ShopConfig, TelegramSession, SystemState } from "./types";
import * as store from "./services/clientStore";
import { supabase } from "./utils/supabase";
import { fetchDeliveryMatrix, addDeliveryZone, deleteDeliveryZone } from "./services/deliveryMatrixApi";
import { buildShopPublicUrl } from "./utils/shopId";
import { loadTownships } from "./data/townships";
import QRCode from "qrcode";

// Complete localized dictionary for total English & Burmese translation sync
const dict = {
  en: {
    appName: "Sales Brain AI",
    smeHubTab: "SME HUB",
    subtitle: "",
    webhooksActive: "Webhooks Active",
    editBusinessProfile: "Edit Profile Info",
    catalogItems: "Catalog items",
    resetDemoState: "Reset Demo State",
    liveBot: "Live Bot",
    defaultBotWarn: "",
    totalStoreRevenue: "Total Store Revenue",
    excludesDelivery: "",
    validatedOrders: "Validated Orders",
    cashOnDeliveryAndPrepay: "",
    needsVerification: "Needs Verification",
    pendingOwnerVerification: "",
    stockWarnings: "Stock Warnings",
    lowStockMsg: "",
    allInventoriesHealthy: "All inventories healthy",
    webhookAlertTitle: "New Payment Receipt Proof ({count})",
    webhookAlertBody: "Owner validation required.",
    reviewReceipts: "Review Receipts now",
    pendingTransactionsLedger: "PENDING TRANSACTIONS & SALES LEDGER",
    validateSubmittedScreenshots: "",
    exportLedgerCsv: "Export Ledger CSV",
    orderInvoice: "Order Invoice",
    clientCustomer: "Client Customer",
    addressLocation: "Address Location",
    paymentMethod: "Payment Method",
    status: "Status",
    invoiceSum: "Invoice Sum",
    receiptVerification: "Receipt Verification",
    evaluateReceiptHeader: "TRANSACTION EVALUATOR & VERIFICATION PREVIEW",
    evaluateReceipt: "Evaluate Receipt",
    approveCod: "Approve COD order",
    markCompleted: "Mark Completed",
    noAuditNeeded: "No audit action needed",
    lowStockTag: "LOW STOCK",
    unitPriceMmk: "Unit Price (MMK)",
    stockLevel: "Stock level",
    invoiceRef: "Invoice Reference",
    transactionId: "Transaction ID",
    paymentChannel: "Payment Channel",
    totalCharged: "Total Charged",
    confirmGenerateInvoice: "Confirm & Generate Invoice",
    rejectScreenshot: "Reject Screenshot",
    closeEvalPane: "Close evaluation pane",
    submittedScreenshotEvidence: "Submitted Screenshot Evidence:",
    premiumStoreCatalog: "PREMIUM STORE CATALOGUE",
    controlProductPrices: "",
    addNewProduct: "Add New Product",
    editInfo: "Edit Info",
    delete: "Delete",
    editProductHeader: "EDIT PRODUCT",
    addNewProductHeader: "ADD NEW PREMIUM PRODUCT",
    brandNameLabel: "Product Brand Name:",
    categoryLabel: "Category:",
    unitPriceLabel: "Unit Price (MMK):",
    availableStockLabel: "Available stock quantity:",
    imageUrlLabel: "Product Image File:",
    shortDescriptionLabel: "Short Description details:",
    confirmProductRevisions: "Confirm product revisions",
    addItemCatalog: "Add item catalog",
    townshipDeliveryRateMatrix: "TOWNSHIP DELIVERY RATE MATRIX",
    defineDeliveryFees: "",
    townshipNameLabel: "Township Name in Yangon:",
    rateLabel: "Rate (MMK):",
    addRateRule: "Add rate rule",
    matchedTownship: "Matched Township",
    estimatedTransit: "Estimated transit timeline",
    settingsActions: "Settings Actions",
    removeRule: "Remove Rule",
    weeklyStoreVolume: "Weekly store checkout volume",
    leanAccountingStatsSummary: "LEAN ACCOUNTING STATS SUMMARY",
    grossSalesValue: "Gross sales value:",
    ordersCompiled: "Orders compiled:",
    canceledTransactions: "Canceled transactions:",
    downloadLedgerCsv: "Download Ledger CSV Report",
    salesBrainAdvisorDesk: "SALES BRAIN AI ADVISOR DESK",
    strategicAnalysisPoweredBySparkles: "",
    reEvaluateStrategy: "Re-evaluate strategy",
    analyzingPatterns: "Sales Brain is analyzing customer patterns...",
    telegramBotActivationWorkspace: "TELEGRAM BOT ACTIVATION WORKSPACE",
    oneClickOnboardingDesc: "",
    storeNameLabel: "Store Name:",
    smeOwnerNameLabel: "SME Owner Name:",
    contactPhoneLabel: "Contact Phone Number:",
    telegramBotUsernameLabel: "Telegram Bot Username (@):",
    saveStoreSettingsBtn: "SAVE STORE SETTINGS AND ACTIVATED TELEGRAM VIRTUAL DEPLOY",
    messengerBotActivationWorkspace: "MESSENGER BOT ACTIVATION WORKSPACE",
    connectMessengerBot: "Connect Messenger Bot",
    connectFacebookPage: "Connect Messenger Bot",
    signInFacebookFirst: "Sign in with Facebook to link your business Page, then choose which Page should run the Messenger bot.",
    oauthCompleteChoosePage: "Facebook sign-in complete. Select the Page you want to use for Messenger:",
    activateMessengerBot: "Activate Messenger Bot",
    selectPageLabel: "Choose your Facebook Page:",
    disconnectFacebook: "Disconnect Messenger Bot",
    liveSupportRoomHeader: "SME CRM LIVE SUPPORT ROOM",
    chatTakeoverDesc: "",
    activeUserSessionsLabel: "ACTIVE USER SESSIONS:",
    supportLabel: "SUPPORT",
    aiAutoLabel: "AI AUTO",
    noMessagesChosen: "No messages chosen",
    activeModeLabel: "Active mode:",
    manualSupportOverrideLabel: "Manual Support Override",
    automatedBotActiveLabel: "Automated Bot active",
    turnOnAiBotLabel: "Turn On AI Bot Agent",
    switchToManualLabel: "Switch to Manual Mode",
    ownerChatInputPlaceholder: "Chat direct with client here...",
    takeoverPlaceholder: "Takeover session to text with customers personally...",
    sendMessageBtn: "Send Message",
    integrationQuickGuidance: "INTEGRATION QUICK GUIDANCE",
    quickGuidanceExplanation: "SME shop owners add/delete items in the left Product Matrix, adjust Delivery Matrix, and click the chat buttons on the right inside our simulator. Chat responses are produced immediately.",
    viewSimulatorButton: "Simulate Customer Chat",
    closeSimulatorButton: "Hide Chat Simulator",
    simulationSandboxTitle: "Telegram Sandbox Client Simulator",
    chooseLanguageLabel: "Language / ဘာသာစကား",
    tabOrders: "Orders Ledger",
    tabProducts: "Product Catalog",
    tabDelivery: "Delivery Matrix",
    tabInsights: "AI Strategy",
    tabSmartMarketing: "Smart Marketing",
    tabConfig: "Bot Connection",
    tabLiveSupport: "Live VIP Support",
    categories: {
      "Desserts": "Sweet Desserts & Cakes",
      "Beverages": "Artisanal Drinks & Mixes",
      "Lifestyle": "Traditional Arts & Crafts",
      "Snacks": "Cracker Snacks"
    }
  },
  my: {
    appName: "Sales Brain AI (မြန်မာ)",
    smeHubTab: "အက်စအမ်အီး ဗဟို",
    subtitle: "",
    webhooksActive: "ချိတ်ဆက်မှု အဆင်သင့်ရှိသည်",
    editBusinessProfile: "လုပ်ငန်းအချက်အလက် ပြင်မည်",
    catalogItems: "လက်ရှိပစ္စည်းများ",
    resetDemoState: "စမ်းသပ်မှုစနစ် ပြန်စရန်",
    liveBot: "တယ်လီဂရမ် ဘော့တ်",
    defaultBotWarn: "",
    totalStoreRevenue: "စုစုပေါင်း အရောင်းရငွေ",
    excludesDelivery: "",
    validatedOrders: "အတည်ပြုပြီး အော်ဒါများ",
    cashOnDeliveryAndPrepay: "",
    needsVerification: "စစ်ဆေးရန်လိုအပ်သည်",
    pendingOwnerVerification: "",
    stockWarnings: "ပစ္စည်းအနည်းငယ်သာ ကျန်တော့သည်",
    lowStockMsg: "",
    allInventoriesHealthy: "ကုန်ပစ္စည်း အားလုံး လုံလောက်မှုရှိပါသည်",
    webhookAlertTitle: "ငွေလွှဲဖြတ်ပိုင်းအသစ် ရောက်ရှိလာခြင်း ({count})",
    webhookAlertBody: "စစ်ဆေးရန်လိုအပ်ပါသည်။",
    reviewReceipts: "ဖြတ်ပိုင်းများ အခုပဲ စစ်ဆေးရန်",
    pendingTransactionsLedger: "ငွေလွှဲစစ်ဆေးရန်နှင့် ရောင်းရငွေစာရင်းချုပ်",
    validateSubmittedScreenshots: "",
    exportLedgerCsv: "အော်ဒါစာရင်း CSV ထုတ်ယူရန်",
    orderInvoice: "အော်ဒါ ဘောက်ချာ ID",
    clientCustomer: "ဝယ်သူ အချက်အလက်",
    addressLocation: "လိပ်စာနှင့် ပို့ဆောင်ရန်",
    paymentMethod: "ငွေပေးချေမှုပုံစံ",
    status: "အော်ဒါ အခြေအနေ",
    invoiceSum: "ကျသင့်ငွေ စုစုပေါင်း",
    receiptVerification: "ဖြတ်ပိုင်း အတည်ပြုချက်",
    evaluateReceiptHeader: "ငွေလွှဲဖြတ်ပိုင်း စီစစ်အတည်ပြုခန်း",
    evaluateReceipt: "ဖြတ်ပိုင်းစစ်ဆေးရန်",
    approveCod: "CoD အော်ဒါ အတည်ပြုရန်",
    markCompleted: "ပြီးမြောက်ကြောင်း သတ်မှတ်ရန်",
    noAuditNeeded: "လုပ်ဆောင်ရန် မလိုပါ",
    lowStockTag: "ပစ္စည်းနည်းနေပါသည်",
    unitPriceMmk: "ဈေးနှုန်း (ကျပ်)",
    stockLevel: "လက်ကျန်အရေအတွက်",
    invoiceRef: "ဘောက်ချာ ရည်ညွှန်းချက် ID",
    transactionId: "ငွေလွှဲကုဒ် ID (Transaction ID)",
    paymentChannel: "ငွေပေးချေမှု လမ်းကြောင်း",
    totalCharged: "ကျသင့်ငွေ စုစုပေါင်း",
    confirmGenerateInvoice: "ငွေလွှဲမှန်ကန်ကြောင်း အတည်ပြုပြီး ဘောက်ချာပို့ရန်",
    rejectScreenshot: "ဖြတ်ပိုင်းအချက်အလက်ကို ပယ်ဖျက်ရန်",
    closeEvalPane: "စစ်ဆေးပြီး စာမျက်နှာကိုပိတ်ရန်",
    submittedScreenshotEvidence: "ဝယ်သူပေးပို့လာသည့် ငွေလွှဲဖြတ်ပိုင်း -",
    premiumStoreCatalog: "ရောင်းချနေသည့် ကုန်ပစ္စည်းများစာရင်း",
    controlProductPrices: "",
    addNewProduct: "ကုန်ပစ္စည်းအသစ် ထည့်သွင်းရန်",
    editInfo: "ပြင်ဆင်ရန်",
    delete: "ဖျက်ရန်",
    editProductHeader: "ကုန်ပစ္စည်းအချက်အလက် ပြင်ဆင်ရန်",
    addNewProductHeader: "ကုန်ပစ္စည်းအသစ် ထည့်သွင်းခြင်း",
    brandNameLabel: "ကုန်ပစ္စည်းအမည် -",
    categoryLabel: "အမျိုးအစား သတ်မှတ်ချက် -",
    unitPriceLabel: "သတ်မှတ်စျေးနှုန်း (ကျပ်) -",
    availableStockLabel: "လက်ကျန် အရေအတွက် -",
    imageUrlLabel: "ကုန်ပစ္စည်း ဓာတ်ပုံဖိုင်တင်ရန် -",
    shortDescriptionLabel: "ပစ္စည်း အကျဉ်းချုပ် ဖော်ပြချက် -",
    confirmProductRevisions: "ပြင်ဆင်မှုများအား သိမ်းဆည်းရန်",
    addItemCatalog: "ကုန်ပစ္စည်းစာရင်းထဲ ထည့်မည်",
    townshipDeliveryRateMatrix: "မြို့နယ်အလိုက် ပို့ဆောင်ခ သတ်မှတ်ချက်ဇယား",
    defineDeliveryFees: "",
    townshipNameLabel: "ရန်ကုန်မြို့တွင်း မြို့နယ်အမည် -",
    rateLabel: "နှုန်းထား (ကျပ်) -",
    addRateRule: "နှုန်းထားအသစ် ထည့်သွင်းမည်",
    matchedTownship: "သတ်မှတ်မြို့နယ်",
    estimatedTransit: "ကြာမြင့်ချိန် ခန့်မှန်းချက်",
    settingsActions: "လုပ်ဆောင်ရန်",
    removeRule: "ဖျက်ပစ်ရန်",
    weeklyStoreVolume: "အပတ်စဉ် ရောင်းချရမှု ပမာဏပြဇယား",
    leanAccountingStatsSummary: "ရောင်းရဝင်ငွေ စာရင်းချုပ် အကျဉ်း",
    grossSalesValue: "စုစုပေါင်း ရောင်းရငွေ -",
    ordersCompiled: "စုစုပေါင်း အော်ဒါအရေအတွက် -",
    canceledTransactions: "ပယ်ဖျက်လိုက်သော အော်ဒါများ -",
    downloadLedgerCsv: "ရောင်းအား အချက်အလက် CSV ထုတ်ယူရန်",
    salesBrainAdvisorDesk: "ရောင်းအားမြှင့်တင်ရေး အေအိုင် အကြံပေးခန်း",
    strategicAnalysisPoweredBySparkles: "",
    reEvaluateStrategy: "အကြံပြုချက်ပြန်လည်တွက်ချက်ရန်",
    analyzingPatterns: "အေအိုင်မှ ရောင်းဝယ်မှုပုံစံများကို စီစစ်တွက်ချက်နေပါသည်...",
    telegramBotActivationWorkspace: "တယ်လီဂရမ် Bot စတင်ချိန်ညှိမှု လုပ်ငန်းခွင်",
    oneClickOnboardingDesc: "",
    storeNameLabel: "ဆိုင်အမည် -",
    smeOwnerNameLabel: "ဆိုင်ရှင်အမည် -",
    contactPhoneLabel: "ဆက်သွယ်ရန် ဖုန်းနံပါတ် -",
    telegramBotUsernameLabel: "တယ်လီဂရမ် Bot ယူဇာနိမ်း (@) -",
    saveStoreSettingsBtn: "ဆိုင်အချက်အလက် စနစ် သိမ်းဆည်းပြီး တယ်လီဂရမ်နှင့် ချိတ်ဆက်မည်",
    messengerBotActivationWorkspace: "မက်ဆင်ဂျာ ဘော့တ် ချိတ်ဆက်မှု စနစ်",
    connectMessengerBot: "Messenger ဘော့တ် ချိတ်ဆက်ရန်",
    connectFacebookPage: "Messenger ဘော့တ် ချိတ်ဆက်ရန်",
    signInFacebookFirst: "Facebook ဖြင့် ဝင်ရောက်ပြီး သင့် Page ကို ရွေးချယ်ပါ။ Messenger ဘော့တ်အတွက် မည်သည့် Page သုံးမည်ကို ရွေးပါ။",
    oauthCompleteChoosePage: "Facebook ဝင်ရောက်မှု အောင်မြင်ပါပြီ။ Messenger အတွက် Page ရွေးချယ်ပါ:",
    activateMessengerBot: "Messenger ဘော့တ် စတင်အသုံးပြုရန်",
    selectPageLabel: "သင်၏ Facebook Page ကို ရွေးချယ်ပါ -",
    disconnectFacebook: "Facebook Page ချိတ်ဆက်မှု ဖြတ်ရန်",
    liveSupportRoomHeader: "ဆိုင်ရှင် တိုက်ရိုက် ဝယ်သူစကားပြောခန်း (CRM)",
    chatTakeoverDesc: "",
    activeUserSessionsLabel: "လက်ရှိ စကားပြောနေဆဲ ဝယ်သူများ -",
    supportLabel: "ဆိုင်ရှင်",
    aiAutoLabel: "အေအိုင် ဘော့တ်",
    noMessagesChosen: "ရွေးချယ်ထားသော စကားပြောခြင်း မရှိပါ",
    activeModeLabel: "လက်ရှိစနစ်ပုံစံ -",
    manualSupportOverrideLabel: "ဆိုင်ရှင် တိုက်ရိုက် ဖြေကြားနေသည်",
    automatedBotActiveLabel: "အလိုအလျောက် AI ဖြေကြားနေသည်",
    turnOnAiBotLabel: "AI စနစ်ကို ပြန်ဖွင့်ရန်",
    switchToManualLabel: "ဆိုင်ရှင် တိုက်ရိုက်ဝင်ဖြေရန် (Takeover)",
    ownerChatInputPlaceholder: "ဝယ်သူထံ စာတိုက်ရိုက်ရေးသားရန်...",
    takeoverPlaceholder: "ဝယ်သူနှင့် တိုက်ရိုက်စကားပြောရန် Takeover စနစ်ကို နှိပ်ပါ...",
    sendMessageBtn: "စာပို့ရန်",
    integrationQuickGuidance: "လမ်းညွှန်ချက် အကျဉ်းချုပ်",
    quickGuidanceExplanation: "ဆိုင်ရှင်ဦးစားပေးစနစ်ဖြစ်ပြီး ဘယ်ဘက်ခြမ်းတွင် ဆိုင်အော်ဒါများစစ်ဆေးခြင်း၊ ပစ္စည်းစာရင်းထိန်းချုပ်ခြင်းများ ပြುလုပ်နိုင်ပါသည်။ ညာဘက်ခြမ်း 'စမ်းသပ်ဝယ်ယူသူ စနစ်' ကိုဖွင့်ပြီး တယ်လီဂရမ်ဝယ်ယူမှုပုံစံများကို တိုက်ရိုက်စမ်းသပ်ကြည့်ရှုနိုင်သည်။",
    viewSimulatorButton: "ဝယ်သူစုံစမ်းစမ်းသပ်ခန်း အသုံးပြုရန်",
    closeSimulatorButton: "စမ်းသပ်ခန်းပြန်သိမ်းရန်",
    simulationSandboxTitle: "တယ်လီဂရမ် ဝယ်သူ စမ်းသပ်ဝယ်ယူမှု စနစ်",
    chooseLanguageLabel: "Language / ဘာသာစကား",
    tabOrders: "အော်ဒါမှတ်တမ်း",
    tabProducts: "ကုန်ပစ္စည်းများ",
    tabDelivery: "ပို့ဆောင်ခနှုန်းထား",
    tabInsights: "မဟာဗျူဟာ (AI)",
    tabSmartMarketing: "မားကက်တင်း (AI)",
    tabConfig: "ဘော့တ်ချိတ်ဆက်မှု",
    tabLiveSupport: "VIP တိုက်ရိုက်ပြောခန်း",
    categories: {
      "Desserts": "အချိုပွဲနှင့် မုန့်မျိုးစုံ",
      "Beverages": "လက်လုပ်ဖျော်ရည်နှင့် အဖျော်ယမကာ",
      "Lifestyle": "ရိုးရာအနုပညာနှင့် လက်မှုပစ္စည်း",
      "Snacks": "အကြွပ်မုန့်မျိုးစုံ"
    }
  }
};

function TelegramQRCode() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, "https://t.me/Jjkql_bot", { width: 160, margin: 2 });
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <canvas ref={canvasRef} className="rounded-lg" />
      <p className="text-[10px] font-mono text-slate-500">@Jjkql_bot</p>
      <p className="text-[9px] text-slate-400">Scan to open bot in Telegram</p>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [lang, setLang] = useState<"en" | "my">("en");
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    const stored = localStorage.getItem('sales_brain_visited');
    return stored !== 'true';
  });
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Simple routing for public shop view
  const shopMatch = window.location.pathname.match(/\/shop\/([^\/]+)/);
  const publicShopId = shopMatch ? shopMatch[1] : null;

  if (publicShopId) {
    return <PublicShop shopId={publicShopId} />;
  }

  // Helper dictionary access
  const t = (key: keyof typeof dict['en']): any => {
    return dict[lang][key] || dict['en'][key];
  };

  // Main Store State
  const [storeState, setStoreState] = useState<SystemState | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "delivery" | "insights" | "bot_config" | "live_support" | "smart_marketing">("orders");
  const [botConnectionTab, setBotConnectionTab] = useState<"messenger" | "telegram">("messenger");
  const [activeSessionId, setActiveSessionId] = useState<string>("default_customer");

  // Onboarding / Config Draft state
  const [shopRecord, setShopRecord] = useState<ShopRecord | null>(null);
  const [editingOnboarding, setEditingOnboarding] = useState(false);
  const [configDraft, setConfigDraft] = useState<ShopConfig | null>(null);
  const [messengerStatus, setMessengerStatus] = useState<{
    connected: boolean;
    oauth_completed?: boolean;
    pending_page_selection?: boolean;
    pages: { id: string; name: string }[];
    active_page_id?: string | null;
    error?: string;
  } | null>(null);
  const [loadingMessengerStatus, setLoadingMessengerStatus] = useState<boolean>(false);
  const [pendingPageId, setPendingPageId] = useState<string>("");

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);
  const [savingAction, setSavingAction] = useState<boolean>(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Forms / Input Dialogs State
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNotification, setShowNotification] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [copiedConfigLink, setCopiedConfigLink] = useState<boolean>(false);

  // New Product Form state
  const [prodForm, setProdForm] = useState({
    name: "",
    price: 4500,
    description: "",
    stock: 25,
    image: "",
    varies: [] as { key: string; value: string }[],
    is_on_demand: false,
    waiting_time: ""
  });

  // New Zone Form state
  const [newZone, setNewZone] = useState({
    township_name: "",
    region: "",
    division: "",
    rate: 2000,
    estimated_transit_timeline: "1-2 Days"
  });
  const [showTownshipSuggestions, setShowTownshipSuggestions] = useState(false);

  // Delivery zones from API
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryZonesLoading, setDeliveryZonesLoading] = useState(false);
  const [deliveryZonesPage, setDeliveryZonesPage] = useState(1);
  const [deliveryZonesSearch, setDeliveryZonesSearch] = useState("");
  const [deliveryZonesPagination, setDeliveryZonesPagination] = useState({
    total_records: 0,
    current_page: 1,
    limit: 10,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });

  // Owner custom live reply states
  const [ownerReplyText, setOwnerReplyText] = useState<string>("");
  const [activeVerificationReceipt, setActiveVerificationReceipt] = useState<Order | null>(null);

  // Fetch shop state from Supabase Storage
  const fetchState = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      // 1. Fetch JSON state from storage
      const data = await getShopState(user.id);
      
      // 2. Sync shop row from Postgres (source of truth for onboarding)
      try {
        const shopRow = await getShopForOwner(user.id);
        if (shopRow) {
          setShopRecord(shopRow);
          data.config.onboardingCompleted = shopRow.onboarding_completed;
          if (shopRow.shop_id) {
            data.config.shopId = shopRow.shop_id;
          } else {
            // Fallback for legacy shopId during migration
            const { data: legacy } = await supabase
              .from('business_onboarding')
              .select('shop_id')
              .eq('user_id', user.id)
              .maybeSingle();
            if (legacy?.shop_id) {
              data.config.shopId = legacy.shop_id;
            }
          }
          if (shopRow.shop_name) {
            data.config.shopName = shopRow.shop_name;
          }
          if (shopRow.owner_name) {
            data.config.ownerName = shopRow.owner_name;
          }
          const shopPhone =
            shopRow.phone?.trim() ||
            shopRow.onboarding_profile?.phone?.trim() ||
            "";
          if (shopPhone) {
            data.config.phone = shopPhone;
          }
        } else {
          setShopRecord(null);
        }
      } catch (dbError) {
        console.warn("Shop fetch error:", dbError);
      }

      // 3. Migrate products from JSON to table if needed
      if (data.products && data.products.length > 0 && !data.config.productsMigrated) {
        const result = await migrateProductsFromJson(user.id, data.products);
        if (result.success) {
          data.products = [];
          data.config.productsMigrated = true;
          await saveShopState(user.id, data);
        }
      }

      // 4. Fetch products from table
      const products = await getProducts(user.id);
      data.products = products;

      // 5. Update states ONLY after all sync logic is done
      setStoreState(data);

      setConfigDraft((prev) => {
        if (activeTab === "bot_config" && prev) return prev;
        return data.config;
      });
      if (data.sessions && Object.keys(data.sessions).length > 0) {
        const keys = Object.keys(data.sessions);
        if (!keys.includes(activeSessionId)) {
          setActiveSessionId(keys[0]);
        }
      }
    } catch (err) {
      console.debug("State load err:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const persistState = async (next: SystemState) => {
    if (!user) return;
    // Exclude products from JSON storage - they live in the products table now
    const stateToSave = { ...next, products: [] };
    await saveShopState(user.id, stateToSave);
    setStoreState(next);
  };

  const fetchMessengerStatus = async () => {
    setLoadingMessengerStatus(true);
    try {
      const data = await invokeApi<{
        connected: boolean;
        oauth_completed?: boolean;
        pending_page_selection?: boolean;
        pages: { id: string; name: string }[];
        active_page_id?: string | null;
        error?: string;
      }>("messenger/status");
      const pages = Array.isArray(data.pages) ? data.pages : [];
      setMessengerStatus({
        connected: Boolean(data.connected),
        oauth_completed: Boolean(data.oauth_completed),
        pending_page_selection: Boolean(data.pending_page_selection),
        pages,
        active_page_id: data.active_page_id,
        error: data.error,
      });
      if (data.active_page_id) {
        setPendingPageId(String(data.active_page_id));
      } else if (pages.length === 1) {
        setPendingPageId(pages[0].id);
      }
    } catch {
      setMessengerStatus({
        connected: false,
        pages: [],
        error: "Could not reach API. Check Omnichannel backend on port 8000.",
      });
    } finally {
      setLoadingMessengerStatus(false);
    }
  };

  const startFacebookConnect = async () => {
    try {
      const redirectUri =
        (import.meta.env.VITE_FB_REDIRECT_URI as string | undefined)?.replace(/\/$/, "") ||
        `${window.location.origin}/facebook/callback`;

      const data = await invokeApi<{ url?: string; state?: string; error?: string }>(
        "messenger/auth-url",
        { redirect_uri: redirectUri }
      );
      if (data.error || !data.url) {
        showToast(
          data.error ||
            (lang === "my"
              ? "Facebook ချိတ်ဆက်မှု မစတင်နိုင်ပါ။"
              : "Unable to start Facebook login."),
          "info"
        );
        return;
      }

      if (data.state) {
        sessionStorage.setItem("fb_oauth_state", data.state);
      }

      const popup = window.open(data.url, "fb_oauth", "width=620,height=720");
      if (!popup) {
        showToast(
          lang === "my" ? "Popup ကို ခွင့်ပြုပေးပါ။" : "Please allow popups for this site.",
          "info"
        );
        return;
      }

      const onMessage = (ev: MessageEvent) => {
        if (ev.data?.type === "messenger_oauth_done") {
          window.removeEventListener("message", onMessage);
          fetchMessengerStatus();
          fetchState(true);
        }
      };
      window.addEventListener("message", onMessage);

      const poll = setInterval(() => {
        if (popup.closed) {
          clearInterval(poll);
          window.removeEventListener("message", onMessage);
          fetchMessengerStatus();
          fetchState(true);
        }
      }, 2000);
      setTimeout(() => {
        clearInterval(poll);
        window.removeEventListener("message", onMessage);
      }, 180000);
    } catch {
      showToast(
        lang === "my"
          ? "Omnichannel backend (port 8000) ကို ဖွင့်ထားပါ။"
          : "Start Omnichannel backend: uvicorn app.main:app --reload --port 8000",
        "info"
      );
    }
  };

  const fetchDeliveryZonesFromApi = async () => {
    setDeliveryZonesLoading(true);
    const shopAddress =
      shopRecord?.address?.trim() ||
      shopRecord?.onboarding_profile?.business_address?.trim() ||
      "";
    try {
      const result = await fetchDeliveryMatrix(
        deliveryZonesPage,
        10,
        deliveryZonesSearch,
        shopAddress
      );
      setDeliveryZones(result.data);
      setDeliveryZonesPagination(result.pagination);
    } catch (err) {
      console.error("Failed to fetch delivery zones:", err);
      showToast(
        lang === "my" 
          ? "ပို့ဆောင်ခ အချက်အလက်များ ရယူ၍မရပါ" 
          : "Failed to load delivery zones", 
        "error"
      );
    } finally {
      setDeliveryZonesLoading(false);
    }
  };

  // Run initial state loading and setup periodic fast poll to grab customer simulator inputs immediately!
  useEffect(() => {
    if (user && !authLoading) {
      localStorage.setItem('sales_brain_visited', 'true');
    }
    if (!user) return;
    fetchState();
    const interval = setInterval(() => {
      fetchState(true);
    }, 4500);

    return () => clearInterval(interval);
  }, [user?.id, authLoading]);

  // Load Messenger status when opening the Messenger tab (not on every state poll)
  useEffect(() => {
    if (activeTab !== "bot_config" || botConnectionTab !== "messenger") return;
    if (storeState) {
      setConfigDraft((prev) => prev ?? storeState.config);
      if (botConnectionTab === "messenger") {
        fetchMessengerStatus();
      }
    }
  }, [activeTab, storeState, botConnectionTab]);

  // Fetch delivery zones when tab, page, search, or shop address changes
  useEffect(() => {
    if (activeTab === "delivery") {
      fetchDeliveryZonesFromApi();
    }
  }, [
    activeTab,
    deliveryZonesPage,
    deliveryZonesSearch,
    shopRecord?.address,
    shopRecord?.onboarding_profile?.business_address,
  ]);

  // Fetch AI strategy when the selected language changes
  useEffect(() => {
    fetchAiStrategy();
  }, [lang]);

  // Display toast alerts
  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setShowNotification({ text, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Retrieve AI Strategizer
  const fetchAiStrategy = async (_force: boolean = false) => {
    setLoadingAi(true);
    try {
      const data = await store.getAiStrategy(lang);
      setAiAnalysisText(data.strategy);
    } catch (err) {
      console.warn("Failed to load AI strategy briefing:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Onboarding Setup submit
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeState) return;
    setSavingAction(true);
    try {
      const data = await invokeApi<{ config?: ShopConfig }>("onboarding", {
        ...(configDraft || storeState.config),
      });
      if (data?.config) {
        setStoreState((prev) => (prev ? { ...prev, config: data.config! } : prev));
        setConfigDraft(data.config);
      }
      {
        showToast(
          lang === "my" 
            ? "ဆိုင်အချက်အလက် စနစ် သိမ်းဆည်းပြီး တယ်လီဂရမ်နှင့် ချိတ်ဆက်ပြီးပါပြီ။ 🟢" 
            : "Online Shop Settings configured! Telegram Bot activated. 🟢",
          "success"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAction(false);
    }
  };

  // Reset demo store system to original template defaults
  const handleResetSystem = async () => {
    const confirmationMsg = lang === "my"
      ? "သရုပ်ပြစနစ်အား မူလစက်ရုံထုတ်ပုံစံ ပြန်လည်စတင်လိုပါသလား? ၎င်းသည် စမ်းသပ်ထားသော အော်ဒါများ၊ ကုန်ပစ္စည်းများနှင့် ချိန်ညှိမှုအားလုံးကို ပျက်ပြယ်စေမည်ဖြစ်သည်။"
      : "Restore factory demo values? This resets active simulator carts, orders checklist, and custom shop configurations.";
    
    if (window.confirm(confirmationMsg)) {
      try {
        await invokeApi("reset");
        {
          showToast(
            lang === "my"
              ? "စမ်းသပ်မှုစနစ်အား မူလပထမ ပုသိမ်ဟလာဝါအရောင်းဆိုင်ပုံစံ ပြန်လည်သတ်မှတ်ပြီးပါပြီ။"
              : "Platform state successfully refreshed to original Pathein Store data.",
            "success"
          );
          fetchState();
          fetchAiStrategy();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Product actions handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAction(true);
    try {
      const isEdit = !!editingProduct;
      if (!user) return;

      const productData = {
        id: editingProduct?.id,
        name: prodForm.name,
        price: Number(prodForm.price) || 0,
        description: prodForm.description,
        stock: Number(prodForm.stock) || 0,
        image: prodForm.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
        varies: prodForm.varies,
        is_on_demand: prodForm.is_on_demand,
        waiting_time: prodForm.waiting_time,
      };

      const result = await upsertProduct(user.id, productData);
      
      if (result.success) {
        showToast(
          isEdit 
            ? (lang === "my" ? "ကုန်ပစ္စည်းအချက်အလက် ပြင်ဆင်မှု ပြီးမြောက်ပါပြီ။" : "Product information updated successfully!")
            : (lang === "my" ? "ပစ္စည်းအသစ် ကတ်တလောက်ထဲ ထည့်သွင်းပြီးပါပြီ။" : "Added premium product to store catalog!"),
          "success"
        );
        setShowProductModal(false);
        setEditingProduct(null);
        setProdForm({ name: "", price: 4500, description: "", stock: 25, image: "", varies: [], is_on_demand: false, waiting_time: "" });
        fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    const confirmMsg = lang === "my"
      ? `"${prod.name}" အား ကုန်ပစ္စည်းစာရင်းမှ ဖျက်ပစ်ရန် သေချာပါသလား?`
      : `Are you sure you want to remove "${prod.name}" from your catalog?`;

    if (confirm(confirmMsg)) {
      try {
        if (!user) return;
        const result = await deleteProduct(prod.id, user.id);
        if (result.success) {
          showToast(
            lang === "my" ? "ကုန်ပစ္စည်းကို ဖျက်ပြီးပါပြီ။" : "Product removed from catalog.",
            "info"
          );
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delivery zone Matrix adjustments
  const handleAddZone = async () => {
    if (!newZone.township_name.trim()) return;
    try {
      await addDeliveryZone({
        township_name: newZone.township_name,
        region: newZone.region,
        division: newZone.division,
        rate: Number(newZone.rate) || 0,
        estimated_transit_timeline: newZone.estimated_transit_timeline || "1-2 Days",
      });
      showToast(
        lang === "my" 
          ? `${newZone.township_name} အတွက် ပို့ဆောင်ခ သတ်မှတ်ပြီးပါပြီ။` 
          : `Added township rate mapping for: ${newZone.township_name}`, 
        "success"
      );
      setNewZone({ township_name: "", region: "", division: "", rate: 2000, estimated_transit_timeline: "1-2 Days" });
      fetchDeliveryZonesFromApi();
    } catch (err) {
      console.error(err);
      showToast(
        lang === "my" 
          ? "ပို့ဆောင်ခ သတ်မှတ်၍မရပါ" 
          : "Failed to add delivery zone", 
        "error"
      );
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    try {
      await deleteDeliveryZone(id);
      showToast(
        lang === "my"
          ? `${name} ပို့ဆောင်ခ သတ်မှတ်ချက်ကို ဖျက်ထုတ်ပြီးပါပြီ။`
          : `Removed township shipping rule: ${name}`,
        "info"
      );
      fetchDeliveryZonesFromApi();
    } catch (err) {
      console.error(err);
      showToast(
        lang === "my"
          ? "ပို့ဆောင်ခ ဖျက်၍မရပါ"
          : "Failed to delete delivery zone",
        "error"
      );
    }
  };

  // Order payment screenshot evaluation trigger (Accept / Cancel)
  const handleUpdateOrderStatus = async (orderId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await invokeApi("orders/update", { orderId, status });
      {
        showToast(
          lang === "my"
            ? `အော်ဒါ အခြေအနေကို [${status.toUpperCase()}] သို့ ပြောင်းလဲလိုက်ပါပြီ။ ဘောက်ချာပေးပို့လိုက်ပါသည်။`
            : `Order status marked as [${status.toUpperCase()}]! Invoice sent.`,
          "success"
        );
        setActiveVerificationReceipt(null);
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakeover = async (sessId: string) => {
    try {
      await invokeApi("bot/takeover", { sessionId: sessId });
      {
        showToast(
          lang === "my"
            ? "🔴 AI ဘော့တ်ကို ပိတ်လိုက်ပါပြီ။ ဆိုင်ရှင်တိုက်ရိုက်ဖြေကြားနေပါသည်။"
            : "🔴 Bot deactivated. Owner intervention launched! Live chat active.",
          "info"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseToAi = async (sessId: string) => {
    try {
      await invokeApi("bot/release", { sessionId: sessId });
      {
        showToast(
          lang === "my"
            ? "🟢 AI ဘော့တ်ကို ပြန်လည်ဖွင့်လိုက်ပါပြီ။ ဘော့တ်မှ ဆက်လက်ဖြေကြားပါမည်။"
            : "🟢 Bot reactivated. Candy taking over.",
          "success"
        );
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOwnerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerReplyText.trim()) return;
    try {
      await invokeApi("bot/owner-reply", { sessionId: activeSessionId, content: ownerReplyText });
      setOwnerReplyText("");
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Excel Formatter download simulation
  const exportExcelReport = () => {
    if (!storeState) return;
    
    // Create standard CSV structured rows representing store state accounting values
    const headers = "InvoiceID,Customer,Phone,TelegramID,Township,Subtotal,DeliveryRate,GrandTotal,Type,Status,Date\n";
    const rows = storeState.orders.map(o => {
      const prodSub = o.totalAmount - o.deliveryFee;
      return `${o.invoiceId},"${o.customerName}",${o.customerPhone},${o.customerTelegramId},${o.township},${prodSub},${o.deliveryFee},${o.totalAmount},${o.paymentMethod.toUpperCase()},${o.status.toUpperCase()},${o.createdAt}`;
    }).join("\n");

    const content = headers + rows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sales_Brain_Accounting_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(
      lang === "my"
        ? "အော်ဒါစာရင်းချုပ် CSV ဖိုင်အား ဟက်စမာဖိုင်အဖြစ် ထုတ်ယူဒေါင်းလုဒ်ဆွဲပြီးပါပြီ။ 📊"
        : "CSV Ledger Account Excel sheet generated & downloaded! 📊",
      "success"
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070f21] text-slate-100 flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (showLandingPage && !user) {
    return <LandingPage onEnter={() => {
      localStorage.setItem('sales_brain_visited', 'true');
      setShowLandingPage(false);
    }} />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (loading || !storeState) {
    return (
      <div className="min-h-screen bg-[#070f21] text-slate-100 flex flex-col justify-center items-center font-sans space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[9px] text-indigo-400">AI</div>
        </div>
        <div className="text-center font-mono">
          <h2 className="text-sm font-semibold tracking-widest text-[#94a3b8]">SALES BRAIN AI</h2>
          <p className="text-[10px] text-indigo-400/80 mt-1 animate-pulse">Initializing SME Intelligence Suite...</p>
        </div>
      </div>
    );
  }

  const onboardingInitialForm: OnboardingFormState = shopRecord
    ? shopRecordToFormData(shopRecord)
    : emptyOnboardingForm(storeState.config.shopName, storeState.config.ownerName);

  const handleWizardComplete = async (
    profile: { shopName: string; ownerName: string; phone: string; businessAddress: string },
    aiSummary: string,
    wasEdit: boolean
  ) => {
    const updatedState = {
      ...storeState,
      config: {
        ...storeState.config,
        shopName: profile.shopName,
        ownerName: profile.ownerName,
        phone: profile.phone || storeState.config.phone,
        onboardingCompleted: true,
      },
    };
    setStoreState(updatedState);
    setAiAnalysisText(aiSummary);
    setEditingOnboarding(false);

    try {
      await invokeApi("onboarding", {
        ...storeState.config,
        shopName: profile.shopName,
        ownerName: profile.ownerName,
        phone: profile.phone || storeState.config.phone,
        onboardingCompleted: true,
      });
      await saveShopState(user.id, updatedState);
      showToast(
        wasEdit
          ? lang === "my"
            ? "လုပ်ငန်းအချက်အလက် ပြင်ဆင်ပြီးပါပြီ။ 🟢"
            : "Business profile updated successfully. 🟢"
          : lang === "my"
            ? "အချက်အလက် စနစ်သိမ်းဆည်းအောင်မြင်ပြီး လုပ်ငန်းဒိုင်ယာလော့ခ် ဖွင့်လှစ်ပါပြီ။ 🟢"
            : "Setup completed! Welcome to your SME dashboard. 🟢",
        "success"
      );
      await fetchState(true);
    } catch (err) {
      console.error("[App] Saving onboarding stats failed", err);
      setStoreState(updatedState);
    }
  };

  // First-time setup or edit profile from dashboard
  if (!storeState.config.onboardingCompleted || editingOnboarding) {
    return (
      <Onboarding
        key={editingOnboarding ? `edit-${shopRecord?.id ?? "shop"}` : "setup"}
        lang={lang}
        isEditMode={editingOnboarding}
        initialFormData={onboardingInitialForm}
        onLangChange={setLang}
        onCancelEdit={() => setEditingOnboarding(false)}
        onComplete={(profile, aiSummary) =>
          handleWizardComplete(profile, aiSummary, editingOnboarding)
        }
      />
    );
  }
 

  // Derived dashboard analytics values
  const productsCount = storeState.products.length;
  const deliveryZonesCount = deliveryZones.length;
  const verifiedOrders = storeState.orders.filter(o => o.status === "confirmed" || o.status === "completed");
  const unverifiedPrepaysCount = storeState.orders.filter(o => o.status === "verifying" && o.paymentMethod === "prepay").length;
  const alertLowStock = storeState.products.filter(p => p.stock <= 5);
  const isDefaultBot = storeState.config.telegramBotUsername === "ShwePathein_Sale_bot" || !storeState.config.telegramBotUsername;

  const totalSalesRevenue = verifiedOrders.reduce((sum, o) => {
    const revenueBeforeShipping = o.totalAmount; // includes delivery cost
    return sum + (revenueBeforeShipping - o.deliveryFee);
  }, 0);

  // SVG Chart data points matching week dates
  const weekdaysChartData = [
    { label: "Mon", value: 45000 },
    { label: "Tue", value: 32000 },
    { label: "Wed", value: 68000 },
    { label: "Thu", value: 50000 },
    { label: "Fri", value: totalSalesRevenue * 0.45 || 47000 },
    { label: "Sat", value: totalSalesRevenue * 0.70 || 88000 },
    { label: "Sun", value: totalSalesRevenue || 120000 }
  ];

  const activeSession: TelegramSession | undefined = storeState.sessions[activeSessionId] || Object.values(storeState.sessions)[0];

  return (
    <div className="min-h-screen bg-[#f0f9ff] text-slate-900 font-sans flex flex-col selection:bg-sky-500 selection:text-white pb-12 relative overflow-hidden">
      
      {/* Abstract Background soft blurs to give an elegant spatial vibe */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Toast Notification HUD */}
      {showNotification && (
        <div className="fixed top-5 right-5 z-50 animate-bounce transition-all">
          <div className="bg-black/95 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-medium max-w-sm">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium font-mono">{showNotification.text}</span>
          </div>
        </div>
      )}

      {/* Main Elegant Minimalist Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-sky-100 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-slate-900 flex items-center justify-center shadow-xs font-bold text-lg select-none shrink-0 border border-sky-200/40">
            <TrendingUp size={18} className="text-sky-700" />
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center">
              <h1 className="text-xs font-extrabold tracking-widest uppercase font-mono text-slate-900">
                {t("appName")}
              </h1>
              <span className="self-center text-[8px] font-bold bg-sky-50 text-slate-800 px-1.5 py-0.5 rounded uppercase tracking-widest border border-sky-200/50">
                {t("smeHubTab")}
              </span>
            </div>
          </div>
        </div>

        {/* Global Control Row */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          {/* Edit Business Profile / Onboarding Configuration Desk */}
          <button
            onClick={async () => {
              const confirmMsg = lang === "my"
                ? "လုပ်ငန်းအချက်အလက်များကို ပြန်လည်ပြင်ဆင်လိုပါသလား?"
                : "Would you like to edit your business profile details?";

              if (!window.confirm(confirmMsg)) return;

              try {
                const freshShop = await getShopForOwner(user.id);
                if (freshShop) {
                  setShopRecord(freshShop);
                }
                setEditingOnboarding(true);
              } catch (e) {
                console.warn("Could not load profile for edit:", e);
                showToast(
                  lang === "my"
                    ? "အချက်အလက် ဖွင့်မရပါ။ ထပ်စမ်းကြည့်ပါ။"
                    : "Could not load profile. Please try again.",
                  "info"
                );
              }
            }}
            className="flex items-center gap-1.5 text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1.5 px-3 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            <Edit2 size={11} className="text-indigo-600 animate-pulse" />
            <span>{t("editBusinessProfile")}</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="text-[9px] font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg border border-slate-200"
          >
            Sign out
          </button>

          {/* Fully custom Burmese - English switch button */}
          <div className="flex bg-sky-55 p-0.5 rounded-lg border border-sky-200 shrink-0">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                lang === "en" ? "bg-white text-slate-900 shadow-xs border border-sky-100" : "text-slate-500 hover:text-black"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("my")}
              className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                lang === "my" ? "bg-white text-slate-900 shadow-xs border border-sky-100" : "text-slate-500 hover:text-black"
              }`}
            >
              မြန်မာ
            </button>
          </div>

          {/* Quick Sandbox Simulator Floating Button Toggle */}
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              showSimulator 
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                : "bg-black hover:bg-slate-800 text-white"
            }`}
          >
            <Smartphone size={12} />
            <span>{showSimulator ? t("closeSimulatorButton") : t("viewSimulatorButton")}</span>
          </button>

          {/* Previous Live Telegram Bot Link Button */}
          {storeState.config.telegramBotUsername && (
            <a
              href={`https://t.me/${storeState.config.telegramBotUsername.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#229ED9] hover:bg-[#34aadf] text-white flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer border border-[#229ED9]/25 hover:border-white/20"
            >
              <Send size={11} className="rotate-45" />
              <span>{t("liveBot")}</span>
              <ExternalLink size={10} className="opacity-70" />
            </a>
          )}
        </div>
      </header>

      {/* Main Container Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        
        {/* LEFT COLUMN: PRIMARY SME OWNERS WORKSPACE */}
        <main className={`transition-all duration-300 ${showSimulator ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}>
          
          {/* TOP ACTIVE SYSTEM MESSAGES HUB */}
          {unverifiedPrepaysCount > 0 && (
            <div className="bg-amber-500 text-slate-950 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border hover:border-amber-400 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-950/10 rounded-lg">
                  <Bell className="text-slate-950 animate-swing" size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono tracking-wide uppercase">
                    {t("webhookAlertTitle").replace("{count}", String(unverifiedPrepaysCount))}
                  </h4>
                  <p className="text-[10px] text-slate-900 font-medium leading-relaxed mt-0.5">
                    {t("webhookAlertBody")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab("orders");
                  const verifyingOrder = storeState.orders.find(o => o.status === "verifying" && o.paymentMethod === "prepay");
                  if (verifyingOrder) {
                    setActiveVerificationReceipt(verifyingOrder);
                  }
                }}
                className="bg-slate-950 hover:bg-slate-900 text-white text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {t("reviewReceipts")} →
              </button>
            </div>
          )}

          {/* BUSINESS HIGH LEVEL KPI COUNTERS */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                {t("totalStoreRevenue")}
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-bold font-mono text-slate-900">
                  {totalSalesRevenue.toLocaleString()}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 ml-1">MMK</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                {t("validatedOrders")}
              </span>
              <div className="mt-2.5">
                <span className="text-lg font-bold font-mono text-slate-900">
                  {verifiedOrders.length}
                </span>
                <span className="text-[9px] text-slate-400 ml-1">orders</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                {t("needsVerification")}
              </span>
              <div className="mt-2.5">
                <span className={`text-lg font-extrabold font-mono ${unverifiedPrepaysCount > 0 ? "text-amber-600 animate-pulse" : "text-slate-900"}`}>
                  {unverifiedPrepaysCount}
                </span>
                <span className="text-[9px] text-[#475569] ml-1">evals</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                {t("stockWarnings")}
              </span>
              <div className="mt-2.5">
                <span className={`text-lg font-extrabold font-mono ${alertLowStock.length > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  {alertLowStock.length}
                </span>
                <span className="text-[9px] text-slate-400 ml-1">items</span>
              </div>
            </div>

          </section>

          {/* TAB NAVIGATION BAR */}
          <nav className="flex flex-wrap items-center gap-1.5 border-b border-sky-200 pb-px font-medium mb-6">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "orders" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabOrders")}
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "products" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabProducts")}
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "delivery" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabDelivery")}
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "insights" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabInsights")}
            </button>
            <button
              onClick={() => setActiveTab("bot_config")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "bot_config" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabConfig")}
            </button>
            <button
              onClick={() => setActiveTab("live_support")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "live_support" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabLiveSupport")}
            </button>
            <button
              onClick={() => setActiveTab("smart_marketing")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "smart_marketing" 
                  ? "border-black text-black" 
                  : "border-transparent text-slate-500 hover:text-black"
              }`}
            >
              {t("tabSmartMarketing")}
            </button>

            <button
              onClick={handleResetSystem}
              className="ml-auto text-[9px] font-mono font-bold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-md cursor-pointer tracking-wider shrink-0"
            >
              {t("resetDemoState")}
            </button>
          </nav>

          {/* TAB 1: ORDERS VERIFICATION HUB AND LEDGER TABLE */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              
              {/* LEDGER WORKSPACE */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wider font-mono text-slate-900">
                      {t("pendingTransactionsLedger")}
                    </h3>
                  </div>
                  
                  <button
                    onClick={exportExcelReport}
                    className="bg-black hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download size={12} /> {t("exportLedgerCsv")}
                  </button>
                </div>

                {/* Orders responsive Table */}
                <div className="overflow-x-auto text-[11px] text-slate-600">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                        <th className="p-3">{t("orderInvoice")}</th>
                        <th className="p-3">{t("clientCustomer")}</th>
                        <th className="p-3">{t("addressLocation")}</th>
                        <th className="p-3">{t("paymentMethod")}</th>
                        <th className="p-3 text-right">{t("invoiceSum")}</th>
                        <th className="p-3 text-center">{t("receiptVerification")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {storeState.orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No business orders submitted yet.</td>
                        </tr>
                      ) : (
                        storeState.orders.map((o) => {
                          const isVerifying = o.status === "verifying";
                          const isConfirmed = o.status === "confirmed";
                          const isCancelled = o.status === "cancelled";
                          
                          return (
                            <tr key={o.id} className="hover:bg-slate-50/50 transition-all font-mono">
                              <td className="p-3 font-bold text-slate-900 text-[10px]">{o.invoiceId}</td>
                              <td className="p-3 whitespace-nowrap font-sans text-xs">
                                <span className="font-semibold text-slate-800 block">{o.customerName}</span>
                                <span className="text-[10px] text-slate-400 block">{o.customerPhone}</span>
                              </td>
                              <td className="p-3 font-sans text-[10px] text-slate-500 leading-tight">
                                <span className="font-medium text-slate-700 block">{o.township}</span>
                                <span className="text-[9px] text-slate-400 line-clamp-1">{o.addressDetails || o.township}</span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  o.paymentMethod === "prepay" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-teal-50 text-teal-750 border border-teal-100"
                                }`}>
                                  {o.paymentMethod.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900">{o.totalAmount.toLocaleString()} MMK</td>
                              <td className="p-3 text-center">
                                {isVerifying ? (
                                  <button
                                    onClick={() => setActiveVerificationReceipt(o)}
                                    className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded text-[10px] font-bold shadow hover:bg-amber-400 transition-all cursor-pointer"
                                  >
                                    {t("evaluateReceipt")}
                                  </button>
                                ) : o.paymentMethod === "cod" && o.status === "pending" ? (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, "confirmed")}
                                    className="bg-sky-600 text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-sky-500 transition-all cursor-pointer"
                                  >
                                    {t("approveCod")}
                                  </button>
                                ) : o.status === "confirmed" ? (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(o.id, "completed")}
                                    className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-emerald-500 transition-all cursor-pointer"
                                  >
                                    {t("markCompleted")}
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic">{t("noAuditNeeded")}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* EVALUATOR PANEL PREVIEW MODAL ASIDE PANEL */}
              {activeVerificationReceipt && (
                <div className="bg-white border border-amber-500/30 rounded-2xl p-6 shadow-lg animate-fadeIn grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-[9px] font-bold font-mono text-amber-600 select-none block bg-amber-50 p-2 rounded-lg border border-amber-100">
                      {t("evaluateReceiptHeader")}
                    </span>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex flex-col border-b border-slate-100 pb-1.5">
                        <span className="text-[9px] text-slate-400 uppercase">{t("invoiceRef")}:</span>
                        <strong className="text-slate-800 mt-0.5">{activeVerificationReceipt.invoiceId}</strong>
                      </div>
                      <div className="flex flex-col border-b border-slate-100 pb-1.5">
                        <span className="text-[9px] text-slate-400 uppercase">{t("clientCustomer")}:</span>
                        <strong className="text-slate-800 mt-0.5">{activeVerificationReceipt.customerName}</strong>
                      </div>
                      <div className="flex flex-col border-b border-slate-100 pb-1.5">
                        <span className="text-[9px] text-slate-400 uppercase">{t("transactionId")}:</span>
                        <strong className="text-indigo-600 mt-0.5 font-bold">{activeVerificationReceipt.paymentDetails?.transactionId}</strong>
                      </div>
                      <div className="flex flex-col border-b border-slate-100 pb-1.5">
                        <span className="text-[9px] text-slate-400 uppercase">{t("paymentChannel")}:</span>
                        <strong className="text-slate-700 mt-0.5">{activeVerificationReceipt.paymentDetails?.method}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{t("totalCharged")}:</span>
                      <strong className="text-slate-900 font-bold font-mono text-md">
                        {activeVerificationReceipt.totalAmount.toLocaleString()} MMK
                      </strong>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(activeVerificationReceipt.id, "confirmed")}
                        className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer text-center"
                      >
                        {t("confirmGenerateInvoice")}
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(activeVerificationReceipt.id, "cancelled")}
                        className="w-full sm:flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer text-center"
                      >
                        {t("rejectScreenshot")}
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveVerificationReceipt(null)}
                      className="w-full text-center text-[10px] text-slate-400 mt-2 font-mono hover:text-slate-600 underline"
                    >
                      {t("closeEvalPane")}
                    </button>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                      {t("submittedScreenshotEvidence")}
                    </span>
                    <div className="border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-center relative max-h-[290px] overflow-hidden">
                      <img
                        src={activeVerificationReceipt.paymentDetails?.screenshotUrl}
                        alt="Submitted receipt attachment proof"
                        className="w-auto h-auto max-h-[260px] object-contain mx-auto rounded-lg shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: PRODUCT CATALOG SETUP */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h3 className="text-xs font-extrabold font-mono text-slate-900 uppercase">
                    {t("premiumStoreCatalog")}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProdForm({ name: "", price: 4500, description: "", stock: 25, image: "", varies: [], is_on_demand: false, waiting_time: "" });
                    setShowProductModal(true);
                  }}
                  className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> {t("addNewProduct")}
                </button>
              </div>

              {/* Product matrix grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storeState.products.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      
                      {/* Out of stock tag warnings */}
                      {p.stock <= 5 && (
                        <span className="absolute left-2.5 top-2.5 text-[8px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          {t("lowStockTag")} ({p.stock})
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{p.name}</h4>
{p.varies && p.varies.length > 0 && (
                           <div className="flex flex-wrap gap-1.5 mt-2">
                             {p.varies.slice(0, 3).map((vary, idx) => (
                               <div key={idx} className="inline-flex items-center gap-1 text-[9px] font-medium bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/60 px-2 py-1 rounded-lg">
                                 <span className="text-indigo-500 font-semibold">{vary.key}</span>
                                 <span className="text-slate-300">•</span>
                                 <span className="text-indigo-700 font-semibold">{vary.value}</span>
                               </div>
                             ))}
                             {p.varies.length > 3 && (
                               <span className="text-[9px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-1 rounded-lg">
                                 +{p.varies.length - 3}
                               </span>
                             )}
                           </div>
                         )}
                      </div>

                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-400 block">{t("unitPriceMmk")}:</span>
                          <span className="font-mono font-bold text-emerald-600">{p.price.toLocaleString()} MMK</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block text-right">{t("stockLevel")}:</span>
                          <span className="font-mono font-semibold text-slate-600 block text-right">{p.stock} units</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProdForm({
                              name: p.name,
                              price: p.price,
                              description: p.description,
                              stock: p.stock,
                              image: p.image,
                              varies: p.varies || [],
                              is_on_demand: p.is_on_demand || false,
                              waiting_time: p.waiting_time || ""
                            });
                            setShowProductModal(true);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 size={10} /> {t("editInfo")}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash size={10} /> {t("delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Modal Window */}
              {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                  {/* Backdrop Click Dismiss */}
                  <div className="fixed inset-0 cursor-default" onClick={() => setShowProductModal(false)}></div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg text-slate-700 relative z-10 space-y-4 animate-in zoom-in-95 duration-200 my-8">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="text-xs font-extrabold tracking-wider font-mono text-black">
                        {editingProduct ? t("editProductHeader") : t("addNewProductHeader")}
                      </h4>
                      <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs text-slate-600">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-400 uppercase block">{t("brandNameLabel")}</label>
                        <input
                          type="text"
                          required
                          value={prodForm.name}
                          onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g., Shwe Pathein Halawa Extra Pure"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-400 block uppercase">{t("unitPriceLabel")}</label>
                        <input
                          type="number"
                          required
                          value={prodForm.price}
                          onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g., 4500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-semibold text-slate-400 block uppercase">{t("availableStockLabel")}</label>
                          <input
                            type="number"
                            required
                            value={prodForm.stock}
                            onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g., 25"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-semibold text-slate-400 block uppercase">{t("imageUrlLabel")}</label>
                          {prodForm.image ? (
                            <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center justify-between gap-2 shadow-inner h-[38px]">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={prodForm.image}
                                  alt="Product Preview"
                                  className="w-6 h-6 rounded object-cover border border-slate-250 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[9px] text-emerald-600 font-bold truncate">Uploaded</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProdForm({ ...prodForm, image: "" })}
                                className="text-rose-600 hover:text-rose-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase hover:bg-rose-50"
                              >
                                {lang === "my" ? "ဖျက်မည်" : "Remove"}
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 rounded-xl px-3 py-2 cursor-pointer transition-all duration-150 relative h-[38px] text-center">
                              <span className="text-[9px] font-bold text-indigo-600 flex items-center gap-1">
                                <Image size={10} className="shrink-0" />
                                {lang === "my" ? "ဓာတ်ပုံတင်ပါ" : "Upload File"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      setProdForm({ ...prodForm, image: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-400 block uppercase">{t("shortDescriptionLabel")}</label>
                        <textarea
                          value={prodForm.description}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Explain ingredients or packing..."
                        />
                      </div>

                      {/* Varies Section */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-400 block uppercase">
                          {lang === "my" ? "အမျိုးအစားများ" : "VARIES"}
                        </label>
                        <div className="space-y-2">
                          {prodForm.varies.map((vary, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                              <input
                                type="text"
                                value={vary.key}
                                onChange={(e) => {
                                  const updated = [...prodForm.varies];
                                  updated[idx].key = e.target.value;
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder={lang === "my" ? "အမည်" : "Key (e.g., Size)"}
                              />
                              <input
                                type="text"
                                value={vary.value}
                                onChange={(e) => {
                                  const updated = [...prodForm.varies];
                                  updated[idx].value = e.target.value;
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder={lang === "my" ? "တန်ဖိုး" : "Value (e.g., 500g)"}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = prodForm.varies.filter((_, i) => i !== idx);
                                  setProdForm({ ...prodForm, varies: updated });
                                }}
                                className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setProdForm({ ...prodForm, varies: [...prodForm.varies, { key: "", value: "" }] });
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus size={12} /> {lang === "my" ? "အမျိုးအစား ထည့်ရန်" : "Add Varies"}
                          </button>
                        </div>
                      </div>

                      {/* On Demand Toggle */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodForm.is_on_demand}
                            onChange={(e) => setProdForm({ ...prodForm, is_on_demand: e.target.checked, waiting_time: e.target.checked ? prodForm.waiting_time : "" })}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-[11px] font-semibold text-slate-700">
                            {lang === "my" ? "အော်ဒါအလိုက် ပြုလုပ်ရန်" : "On Demand"}
                          </span>
                        </label>
                      </div>

                      {/* Conditional Waiting Time Input */}
                      {prodForm.is_on_demand && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-semibold text-slate-400 block uppercase">
                            {lang === "my" ? "စောင့်ဆိုင်းရမည့်အချိန်" : "WAITING TIME"}
                          </label>
                          <input
                            type="text"
                            value={prodForm.waiting_time}
                            onChange={(e) => setProdForm({ ...prodForm, waiting_time: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={lang === "my" ? "ဥပမာ - ၂ ရက်" : "e.g., 2 days"}
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={savingAction}
                        className="w-full bg-black hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors active:scale-[0.99]"
                      >
                        {savingAction ? "Processing..." : editingProduct ? t("confirmProductRevisions") : t("addItemCatalog")}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOWNSHIP MATRIX CONTROL */}
          {activeTab === "delivery" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-extrabold font-mono text-slate-900 uppercase">
                  {t("townshipDeliveryRateMatrix")}
                </h3>

                {/* Insertion row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 items-end text-xs text-slate-700">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-[#475569] block font-mono font-bold uppercase">{t("townshipNameLabel")}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newZone.township_name}
                        onChange={(e) => {
                          setNewZone({ ...newZone, township_name: e.target.value });
                          setShowTownshipSuggestions(true);
                        }}
                        onFocus={() => setShowTownshipSuggestions(true)}
                        placeholder="e.g., Yankin, Tamwe, North Dagon"
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800 text-xs"
                      />
                      {showTownshipSuggestions && newZone.township_name.trim().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {loadTownships()
                            .filter(t => t.toLowerCase().includes(newZone.township_name.toLowerCase()))
                            .slice(0, 10)
                            .map((township, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs"
                                onClick={() => {
                                  setNewZone({ ...newZone, township_name: township });
                                  setShowTownshipSuggestions(false);
                                }}
                              >
                                {township}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-[#475569] block font-mono font-bold uppercase">{t("rateLabel")}</label>
                    <input
                      type="number"
                      value={newZone.rate}
                      onChange={(e) => setNewZone({ ...newZone, rate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[#0b1429] font-mono"
                    />
                  </div>

                  <button
                    onClick={handleAddZone}
                    className="bg-black hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs cursor-pointer h-9 transition-all uppercase"
                  >
                    {t("addRateRule")}
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                <input
                  type="text"
                  value={deliveryZonesSearch}
                  onChange={(e) => {
                    setDeliveryZonesSearch(e.target.value);
                    setDeliveryZonesPage(1);
                  }}
                  placeholder={lang === "my" ? "မြို့နယ်အမည်ရှာရန်..." : "Search township name..."}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800 text-xs"
                />
              </div>

              {/* Township list grid */}
              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden text-xs shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                      <th className="p-3 w-1/4">{t("matchedTownship")}</th>
                      <th className="p-3 w-1/4">{t("rateLabel")}</th>
                      <th className="p-3 w-1/4">{t("estimatedTransit")}</th>
                      <th className="p-3 w-1/4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-mono">
                    {deliveryZonesLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          <RefreshCw size={16} className="animate-spin inline-block mr-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : deliveryZones.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No delivery zones found
                        </td>
                      </tr>
                    ) : (
                      deliveryZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3 font-bold text-slate-800 w-1/4">{zone.township_name}</td>
                          <td className="p-3 text-emerald-600 font-bold w-1/4">{zone.rate.toLocaleString()} MMK</td>
                          <td className="p-3 text-slate-500 w-1/4">{zone.estimated_transit_timeline}</td>
                          <td className="p-3 text-right w-1/4">
                            <button
                              onClick={() => handleDeleteZone(zone.id, zone.township_name)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title={t("removeRule")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {deliveryZonesPagination.total_pages > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-2xl p-4 text-xs">
                  <div className="text-slate-500 font-mono">
                    Page {deliveryZonesPagination.current_page} of {deliveryZonesPagination.total_pages} 
                    ({deliveryZonesPagination.total_records} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeliveryZonesPage(p => p - 1)}
                      disabled={!deliveryZonesPagination.has_prev}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setDeliveryZonesPage(p => p + 1)}
                      disabled={!deliveryZonesPagination.has_next}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI STRATEGY & REAL BUSINESS INSIGHTS */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              
              {/* SVG Charts section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex-1">
                    <h3 className="text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-2">
                      {t("weeklyStoreVolume")}
                    </h3>
                    <CustomChart data={weekdaysChartData} color="#4f46e5" title="Revenue Matrix" unit="MMK" />
                  </div>
                </div>

                <div className="md:col-span-4 bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-xs font-extrabold font-mono text-slate-700 uppercase tracking-wider mb-2">
                      {t("leanAccountingStatsSummary")}
                    </h3>
                    
                    <div className="mt-4 space-y-3 text-xs font-mono">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <span className="text-slate-400">{t("grossSalesValue")}</span>
                        <strong className="text-slate-800">{totalSalesRevenue.toLocaleString()} MMK</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <span className="text-slate-400">{t("ordersCompiled")}</span>
                        <strong className="text-slate-600">{storeState.orders.length} orders</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <span className="text-slate-400">{t("canceledTransactions")}</span>
                        <strong className="text-rose-500 font-bold">{storeState.orders.filter(o => o.status === 'cancelled').length} entries</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={exportExcelReport}
                    className="w-full bg-black hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold tracking-wider cursor-pointer text-xs flex items-center justify-center gap-2 mt-4"
                  >
                    <Download size={14} /> {t("downloadLedgerCsv")}
                  </button>
                </div>
              </div>

               {/* LIVE GEMINI STRATEGIST ADVICE CARD */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Sparkles size={16} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold tracking-wider font-mono text-slate-800">
                        ✨ {t("salesBrainAdvisorDesk")}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchAiStrategy(true)}
                    disabled={loadingAi}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw size={11} className={loadingAi ? "animate-spin" : ""} /> {loadingAi ? t("analyzingPatterns").substring(0, 10) : t("reEvaluateStrategy")}
                  </button>
                </div>

                {loadingAi ? (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                    <div>{t("analyzingPatterns")}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed text-xs text-slate-700 space-y-3 font-sans max-w-none whitespace-pre-line select-text">
                    {aiAnalysisText}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: BOT ACTIVATION SETUP */}
          {activeTab === "bot_config" && (
            <div className="space-y-4">
              {/* Bot Type Sub-tabs */}
              <div className="flex bg-white/50 p-1 rounded-xl border border-sky-100 w-fit">
                <button
                  onClick={() => setBotConnectionTab("messenger")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    botConnectionTab === "messenger"
                      ? "bg-black text-white shadow-sm"
                      : "text-slate-500 hover:text-black"
                  }`}
                >
                  Messenger
                </button>
                <button
                  onClick={() => setBotConnectionTab("telegram")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    botConnectionTab === "telegram"
                      ? "bg-black text-white shadow-sm"
                      : "text-slate-500 hover:text-black"
                  }`}
                >
                  Telegram
                </button>
              </div>

              {botConnectionTab === "telegram" ? (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm text-slate-700 animate-fadeIn">
                  <h3 className="text-xs font-extrabold font-mono text-slate-900 flex items-center gap-2 mb-1 uppercase">
                    {t("telegramBotActivationWorkspace")}
                  </h3>
                <p className="text-[10px] text-slate-400">{t("oneClickOnboardingDesc")}</p>

                {storeState.config.telegramBotUsername && (
                  <div className="mt-4 p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-between gap-3 text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center font-bold text-sm shrink-0">
                        Bot
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900">
                          {lang === "my" ? "တယ်လီဂရမ် Bot သို့ တိုက်ရိုက်သွားရန်" : "Direct Link to Active Telegram Bot"}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-mono">
                          @{storeState.config.telegramBotUsername.replace("@", "")}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://t.me/${storeState.config.telegramBotUsername.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#229ED9] hover:bg-[#34aadf] text-white flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <Send size={11} className="rotate-45" />
                      <span>{t("liveBot")}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {storeState.config.shopId && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900">
                          {lang === "my" ? "သင်၏ အွန်လိုင်းအရောင်းဆိုင် လင့်ခ်" : "Your Public Shop Link"}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-mono">
                          Share this with your customers
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-600 truncate flex items-center">
                        {buildShopPublicUrl(storeState.config.shopId)}
                      </div>
                      <button
                        onClick={() => {
                          const url = buildShopPublicUrl(storeState.config.shopId!);
                          navigator.clipboard.writeText(url);
                          setCopiedConfigLink(true);
                          setTimeout(() => setCopiedConfigLink(false), 2000);
                        }}
                        className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-[10px] font-bold cursor-pointer shadow-sm ${
                          copiedConfigLink 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {copiedConfigLink ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedConfigLink ? (lang === "my" ? "ကူးပြီး" : "Copied") : (lang === "my" ? "ကူးမည်" : "Copy")}</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleOnboardingSubmit} className="space-y-4 mt-5 text-xs text-slate-600">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase block">{t("storeNameLabel")}</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-xs cursor-not-allowed select-none">
                      {storeState.config.shopName || "—"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase block">{t("smeOwnerNameLabel")}</label>
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-xs cursor-not-allowed select-none">
                        {storeState.config.ownerName || "—"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase block">{t("contactPhoneLabel")}</label>
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-xs cursor-not-allowed select-none">
                        {storeState.config.phone || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase block">{t("telegramBotUsernameLabel")}</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-xs cursor-not-allowed select-none">
                      ရွှေတော်၀င်
                    </div>
                    <a
                      href="https://t.me/Jjkql_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:text-sky-600 font-mono mt-1"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
                      t.me/Jjkql_bot
                    </a>
                  </div>

                  <TelegramQRCode />

                  <button
                    type="submit"
                    disabled={savingAction}
                    className="w-full bg-[#0f1d3a] hover:bg-indigo-900 text-white font-bold py-3 rounded-xl cursor-pointer uppercase text-xs tracking-wider"
                  >
                    {savingAction ? "Re-connecting..." : t("saveStoreSettingsBtn")}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm text-slate-700 animate-fadeIn">
                <h3 className="text-xs font-extrabold font-mono text-slate-900 flex items-center gap-2 mb-1 uppercase">
                  {t("messengerBotActivationWorkspace")}
                </h3>
                
                {loadingMessengerStatus && (
                  <div className="text-[10px] text-slate-400 font-mono mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    Checking Messenger connection…
                  </div>
                )}

                {messengerStatus?.error && !messengerStatus.connected && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-[10px] text-amber-900">
                    {messengerStatus.error}
                  </div>
                )}

                {messengerStatus?.connected ? (
                  <div className="space-y-4 mt-5">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          f
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-900">
                            Active: {storeState.config.messengerBotName || "Facebook Page"}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-mono">
                            ID: {storeState.config.messengerBotId}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm uppercase tracking-wider">
                        Live
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingAction(true);
                        try {
                          await invokeApi("messenger/disconnect");
                          if (storeState && user) {
                            await persistState({
                              ...storeState,
                              config: {
                                ...storeState.config,
                                messengerBotId: "",
                                messengerBotName: "",
                              },
                            });
                          }
                          setPendingPageId("");
                          showToast(
                            lang === "my" ? "Messenger ဘော့တ် ချိတ်ဆက်မှု ပြတ်တောက်ပါပြီ" : "Messenger bot disconnected",
                            "info"
                          );
                          fetchMessengerStatus();
                        } finally {
                          setSavingAction(false);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      {t("disconnectFacebook")}
                    </button>
                  </div>
                ) : messengerStatus?.pending_page_selection ? (
                  <div className="space-y-4 mt-5">
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                      {t("oauthCompleteChoosePage")}
                    </p>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase block">
                        {t("selectPageLabel")}
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-xs"
                        value={pendingPageId}
                        onChange={(e) => setPendingPageId(e.target.value)}
                      >
                        <option value="">-- Select Page --</option>
                        {messengerStatus.pages.map((page) => (
                          <option key={page.id} value={page.id}>{page.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!pendingPageId || savingAction}
                      onClick={async () => {
                        const page = messengerStatus.pages.find((p) => p.id === pendingPageId);
                        if (!page) return;
                        setSavingAction(true);
                        try {
                          const result = await invokeApi<{
                            page_id?: string;
                            page_name?: string;
                          }>("messenger/connect-page", { pageId: page.id });
                          if (storeState && user && result.page_id) {
                            await persistState({
                              ...storeState,
                              config: {
                                ...storeState.config,
                                messengerBotId: result.page_id,
                                messengerBotName: result.page_name || page.name,
                              },
                            });
                          }
                          showToast(
                            lang === "my"
                              ? "Messenger ဘော့တ် စတင်အသုံးပြုနိုင်ပါပြီ!"
                              : "Messenger bot is now active on your Page!",
                            "success"
                          );
                          fetchMessengerStatus();
                        } finally {
                          setSavingAction(false);
                        }
                      }}
                      className="w-full px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      {t("activateMessengerBot")}
                    </button>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center space-y-4 mt-2">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
                      {t("signInFacebookFirst")}
                    </p>
                    <button
                      type="button"
                      onClick={startFacebookConnect}
                      className="px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      {t("connectMessengerBot")}
                    </button>
                  </div>
                )}
              </div>
            )}
          {/* TAB 5 END */}
          </div>
        )}

          {/* CRM DIRECT SUPPORT LIVE WORKSPACE & CHAT TAKE-OVER CRM */}
          {activeTab === "live_support" && (
            <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-xs font-extrabold font-mono text-slate-900 uppercase">
                    {t("liveSupportRoomHeader")}
                  </h3>
                </div>

                {/* Selector for active customer chat session */}
                <select
                  value={activeSessionId}
                  onChange={(e) => setActiveSessionId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-400"
                >
                  {(Object.values(storeState.sessions) as TelegramSession[]).map((sess) => (
                    <option key={sess.sessionId} value={sess.sessionId}>
                      {sess.customerName || "Web Simulator"} ({sess.liveTakeoverActive ? "Owner Active" : "AI Powered"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chat list visual layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-slate-700">
                
                {/* Session list items sidebar */}
                <div className="md:col-span-1 space-y-2 border-r border-slate-100 pr-4">
                  <span className="text-[9px] font-bold font-mono text-slate-400 block tracking-wide uppercase">{t("activeUserSessionsLabel")}</span>
                  {(Object.values(storeState.sessions) as TelegramSession[]).map((sess) => {
                    const isSessActive = sess.sessionId === activeSessionId;
                    const latestMsg = sess.messages[sess.messages.length - 1];

                    return (
                      <div
                        key={sess.sessionId}
                        onClick={() => setActiveSessionId(sess.sessionId)}
                        className={`p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all ${
                          isSessActive
                            ? "bg-slate-50/80 border-black text-slate-900"
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{sess.customerName || "Customer Client"}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${sess.liveTakeoverActive ? "bg-amber-500 animate-pulse" : "bg-black"}`}></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {latestMsg ? latestMsg.content : "No messages recorded"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[8px] font-mono leading-none">
                          <span className={sess.liveTakeoverActive ? "text-amber-600 font-bold" : "text-black font-semibold"}>
                            {sess.liveTakeoverActive ? t("supportLabel") : t("aiAutoLabel")}
                          </span>
                          <span className="text-slate-400">
                            {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CRM Live Dialogue monitor screen */}
                <div className="md:col-span-2 space-y-3 flex flex-col justify-between min-h-[240px]">
                  
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 max-h-[190px] overflow-y-auto">
                    
                    {activeSession ? (
                      activeSession.messages.map((m, idx) => (
                        <div key={idx} className="text-[11px] leading-relaxed">
                          <span className={`font-bold font-mono text-[9px] uppercase tracking-wide ${
                            m.sender === "customer" ? "text-indigo-600" : m.sender === "owner" ? "text-amber-600" : "text-slate-400 font-semibold"
                          }`}>
                            {m.sender === "customer" ? "CLIENT" : m.sender === "owner" ? "SALES HUB" : "SYSTEM CANDY"}:
                          </span>
                          <span className="text-slate-705 ml-1 whitespace-pre-line">{m.content}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic p-3 text-center">{t("noMessagesChosen")}</div>
                    )}
                  </div>

                  {/* Direct Owner Intervention replies */}
                  <form onSubmit={handleSendOwnerMessage} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {t("activeModeLabel")} {activeSession?.liveTakeoverActive ? `${t("manualSupportOverrideLabel")}` : `${t("automatedBotActiveLabel")}`}
                      </span>
                      {activeSession?.liveTakeoverActive ? (
                        <button
                          type="button"
                          onClick={() => handleReleaseToAi(activeSession.sessionId)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                        >
                          {t("turnOnAiBotLabel")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTakeover(activeSession.sessionId)}
                          className="text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer animate-pulse"
                        >
                          {t("switchToManualLabel")}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        disabled={!activeSession?.liveTakeoverActive}
                        value={ownerReplyText}
                        onChange={(e) => setOwnerReplyText(e.target.value)}
                        placeholder={activeSession?.liveTakeoverActive ? t("ownerChatInputPlaceholder") : t("takeoverPlaceholder")}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!activeSession?.liveTakeoverActive || !ownerReplyText.trim()}
                        className="bg-black hover:bg-slate-800 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-all shrink-0 uppercase"
                      >
                        {t("sendMessageBtn")}
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            </section>
          )}

          {activeTab === "smart_marketing" && storeState && (
            <SmartMarketing state={storeState} lang={lang} />
          )}

        </main>

        {/* RIGHT DRAWER: TELEGRAM PHONE SMARTPHONE SIMULATOR */}
        {showSimulator && (
          <aside className="lg:col-span-4 lg:sticky lg:top-[90px] animate-fadeIn">
            
            <div className="bg-[#0f1d3a] border border-slate-700/60 p-4 rounded-2xl mb-4 text-center shadow-lg relative overflow-hidden">
              <div className="bg-gradient-to-tr from-pink-500 to-amber-400 opacity-10 absolute inset-0 blur"></div>
              <h4 className="text-xs font-bold font-mono tracking-wider text-slate-100 relative z-10">
                📱 {t("simulationSandboxTitle")}
              </h4>
              <p className="text-[10px] text-slate-300 mt-1 leading-normal relative z-10">
                {t("quickGuidanceExplanation")}
              </p>
            </div>

            <TelegramSimulator
              session={activeSession}
              products={storeState.products}
              deliveryZones={deliveryZones}
              onStateUpdated={() => fetchState(true)}
              onSendReply={async (text) => {
                fetchState(true);
              }}
              onTriggerTakeover={async () => {
                await handleTakeover(activeSession.sessionId);
              }}
              onTriggerRelease={async () => {
                await handleReleaseToAi(activeSession.sessionId);
              }}
            />
          </aside>
        )}

      </div>

    </div>
  );
}
