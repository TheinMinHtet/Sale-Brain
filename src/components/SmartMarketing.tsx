import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  ArrowRight, 
  Percent, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RotateCw, 
  ShoppingBag, 
  CheckSquare, 
  Share2, 
  Sliders, 
  Award,
  BookOpen
} from "lucide-react";
import { SystemState, Product } from "../types";
import { CustomChart } from "./CustomChart";
import { getAiMarketingImage, getAiMarketingInsights } from "../services/clientStore";

interface SmartMarketingProps {
  state: SystemState;
  lang?: "en" | "my";
}

interface CampaignRecommendation {
  campaignTitle: string;
  rationale: string;
  targetAudience: string;
  discountPercentage: string;
  duration: string;
  expectedImpact: string;
  implementationSteps: string[];
}

interface CopywritingDetail {
  en: string;
  my: string;
}

interface MarketingInsights {
  trendingProducts: string[];
  underperformingProducts: string[];
  lowStockAlerts: string[];
  analyticsSummary: {
    salesGrowthEstimate: string;
    engagementLevel: string;
    bestSellingCategory: string;
  };
  recommendations: CampaignRecommendation[];
  copywriting: {
    facebookCaption: CopywritingDetail;
    instagramCaption: CopywritingDetail;
    adCopy: CopywritingDetail;
    email: CopywritingDetail;
    hashtags: string;
  };
  bannerPrompt: string;
}

const SM_STRINGS = {
  en: {
    stepTitle1: "Diagnostics & Campaign Selection",
    stepTitle2: "AI Campaign Strategy & Copywriting",
    stepTitle3: "Custom Poster Studio & Graphic Builder",
    stepBtn1: "1. Theme & Metrics",
    stepBtn2: "2. Strategy & Copy",
    stepBtn3: "3. Visual Studio",
    chooseProdTitle: "Step 1.1 Choose Products to Promote",
    chooseProdDesc: "Select which items from your inventory you want to actively spotlight. Your campaign copywriting will be specially customized to drive high conversions for these items.",
    chooseThemeTitle: "Step 1.2 Select Campaign Theme / Festival",
    chooseThemeDesc: "Select a festival, regional celebration, rainy season sale, or quick flash discount. Clicking any theme will instantly trigger Gemini AI to synthesize tailored copywriting and strategic workflows.",
    recommendedPkgTitle: "Recommended Sales Campaign Package",
    targetAudience: "Target Audience",
    expectedImpact: "Expected Impact",
    promoDiscount: "Promo Discount",
    campaignDuration: "Campaign Duration",
    socialCopyTitle: "AI High-Conversion Social Copywriting",
    hashtagCluster: "HASHTAG CLUSTER:",
    copy: "Copy",
    copied: "Copied!",
    backToTheme: "⇠ Back to Theme Selection",
    configPosters: "Configure Posters Studio (Step 3) ➔",
    backToStrategy: "⇠ Back to AI Strategy (Step 2)",
    startNewCampaign: "↩ Start New Campaign Builder",
    posterStudioTitle: "Custom Promotional Poster Studio",
    posterLivePreview: "Vertical Poster Live Preview (3:4)",
    posterTitleLabel: "Poster Title",
    promoDiscountLabel: "Promo discount text",
    subheadingLabel: "Subheading / Call-To-Action",
    catalogProductLabel: "Catalog Product Item",
    themeTemplateLabel: "Theme Template Style",
    downloadFlyer: "Download 3:4 Custom Campaign Flyer",
    synthesizing: "Synthesizing Strategy Package...",
    generatingFromGemini: "Drawing recommendations and copywriting translations from Gemini AI model...",
    updatingCreative: "Updating Creative assets...",
    noActiveTheme: "No Active Theme",
    noThemeSelected: "No Theme Selected",
    chooseThemeFirst: "Please choose a campaign theme in Step 1 first.",
    goToStep1: "Go to Step 1",
    styleStudents: "Ocean Wave (Students)",
    styleCozy: "Monsoon Rain (Cozy)",
    styleFlash: "Lightning Rush (Flash Sale)",
    styleThingyan: "Golden Splash (Thingyan)",
    styleChristmas: "Classic Red (Christmas)",
    styleNewYear: "Midnight Glow (New Year)",
    styleValentine: "Maroon Love (Valentine)",
    styleGeneral: "Classic Midnight (General)"
  },
  my: {
    stepTitle1: "ကမ်ပိန်းအကြောင်းအရာ ရွေးချယ်ခြင်း",
    stepTitle2: "အေအိုင် မဟာဗျူဟာနှင့် စာသားများ",
    stepTitle3: "ဒီဇိုင်းပိုစတာနှင့် ပုံရိပ်ဖန်တီးခန်း",
    stepBtn1: "၁။ သီးသန့်ကမ်ပိန်း",
    stepBtn2: "၂။ မဟာဗျူဟာစာသား",
    stepBtn3: "၃။ ဓာတ်ပုံပိုစတာ",
    chooseProdTitle: "အဆင့် ၁.၁ - အရောင်းမြှင့်တင်မည့် ကုန်ပစ္စည်းကို ရွေးပါ",
    chooseProdDesc: "ကမ်ပိန်းတွင် အလေးထား ရောင်းချလိုသည့် အဓိက ကုန်ပစ္စည်းများကို ရွေးချယ်ပါ။ အေအိုင်မှ ဤကုန်ပစ္စည်းများနှင့် အကိုက်ညီဆုံးဖြစ်မည့် စာသားများကို သီးသန့်ရေးသားဖန်တီးပေးပါမည်။",
    chooseThemeTitle: "အဆင့် ၁.၂ - ကမ်ပိန်း ပွဲတော် / ပုံစံကို ရွေးချယ်ပါ",
    chooseThemeDesc: "ပွဲတော်၊ ရေသဘင်၊ မိုးရာသီအထူးရောင်းချမှု သို့မဟုတ် လျှပ်တပြက် လျှော့စျေးများကို ရွေးချယ်ပါ။ သင့်လျော်ရာတစ်ခုကို ရွေးခြင်းဖြင့် Gemini AI က အထိရောက်ဆုံးသော ကမ်ပိန်းစာသားများနှင့် မဟာဗျူဟာများကို ချက်ချင်း စုစည်းတွက်ချက်ပေးပါမည်။",
    recommendedPkgTitle: "အကြံပြုထားသော အရောင်းမြှင့်တင်ရေး အစီအစဉ်အကျဉ်း",
    targetAudience: "ရည်ရွယ်သည့် ဝယ်ယူသူများ",
    expectedImpact: "မျှော်မှန်းထားသော တိုးတက်မှု",
    promoDiscount: "လျှော့စျေးပေးမှု",
    campaignDuration: "ကမ်ပိန်းကာလ",
    socialCopyTitle: "အေအိုင် သီးသန့် ဖန်တီးပေးသော ကြော်ငြာစာသားများ",
    hashtagCluster: "ဟက်ရှ်တက်ဂ် အစုအဖွဲ့များ -",
    copy: "ကူးယူမည်",
    copied: "ကူးယူပြီး!",
    backToTheme: "⇠ အဆင့် ၁ သို့ ပြန်သွားရန်",
    configPosters: "ပိုစတာဒီဇိုင်းဖန်တီးခန်းသို့ ဆက်သွားရန် (အဆင့် ၃) ➔",
    backToStrategy: "⇠ အေအိုင် အကြံပြုချက်သို့ ပြန်သွားရန် (အဆင့် ၂)",
    startNewCampaign: "↩ ကမ်ပိန်းအသစ် ပြန်လည်စတင်ရန်",
    posterStudioTitle: "အရောင်းမြှင့်တင်ရေး ပိုစတာ ဒီဇိုင်းစတူဒီယို",
    posterLivePreview: "မြှင့်တင်ရေးပိုစတာ တိုက်ရိုက်ပုံရိပ် (၃:၄ မျဉ်းမတ်)",
    posterTitleLabel: "ပိုစတာ ခေါင်းစဉ်စာသား",
    promoDiscountLabel: "အထူးလျှော့စျေး ရာခိုင်နှုန်း",
    subheadingLabel: "ခေါင်းစဉ်ငယ် / ဝယ်ယူရန် ဖိတ်ခေါ်ချက်",
    catalogProductLabel: "ပြသမည့် ဆိုင်ကုန်ပစ္စည်းရွေးချယ်ပါ",
    themeTemplateLabel: "နောက်ခံဒီဇိုင်း အသွင်အပြင်စတိုင်",
    downloadFlyer: "ရရှိလာသည့် ၃:၄ အရောင်းပိုစတာပုံရိပ်ကို ရယူရန်",
    synthesizing: "ကမ်ပိန်းမဟာဗျူဟာ တွက်ချက်ဖန်တီးနေပါသည်...",
    generatingFromGemini: "Gemini AI မော်ဒယ်မှ သင့်လျော်သော အကြံပြုချက်များနှင့် စာသားများကို ရေးသားပေးနေပါသည်...",
    updatingCreative: "ဒီဇိုင်းပိုစတာ အဆင်သင့်ဖြစ်အောင် ပြင်ဆင်နေပါသည်...",
    noActiveTheme: "မည်သည့်အကြောင်းအရာမှ မရွေးချယ်ထားပါ",
    noThemeSelected: "မည်သည့်အကြောင်းအရာမှ မရွေးချယ်ရသေးပါ",
    chooseThemeFirst: "အဆင့် ၁ တွင် ကမ်ပိန်းအကြောင်းအရာတစ်ခုကို အရင်ရွေးချယ်ပေးပါ",
    goToStep1: "အဆင့် ၁ သို့ သွားရန်",
    styleStudents: "သမုဒ္ဒရာလှိုင်း (ကျောင်းသား)",
    styleCozy: "မိုးမင်းလွင်ပြင် (မိုးသက်အေးအေး)",
    styleFlash: "လျှပ်စီးအလျဉ် (လျှပ်တပြက်အရောင်း)",
    styleThingyan: "ရွှေရောင်ရေပက် (သင်္ကြန်ပွဲတော်)",
    styleChristmas: "Classic Red (ခရစ်စမတ်)",
    styleNewYear: "သန်းခေါင်ယံအလင်း (နှစ်သစ်ကူး)",
    styleValentine: "Maroon Love (ချစ်သူများနေ့)",
    styleGeneral: "Classic Midnight (အထွေထွေ)"
  }
};

export function SmartMarketing({ state, lang = "en" }: SmartMarketingProps) {
  const currentLang = lang || "en";
  const tSM = (key: keyof typeof SM_STRINGS["en"]) => {
    return SM_STRINGS[currentLang][key] || SM_STRINGS["en"][key];
  };

  const PRESET_CAMPAIGNS = [
    { 
      id: "BackToSchool", 
      name: currentLang === "my" ? "ကျောင်းဖွင့်ရာသီ အထူးအစီအစဉ်" : "Back-to-School", 
      desc: currentLang === "my" ? "ကျောင်းသားလူငယ်များအတွက် အာဟာရပြည့်မုန့်ဗူးများနှင့် စာသင်ခန်းအဆာပြေများ" : "Nutritious school snack boxes & study treats", 
      color: "from-sky-400 to-blue-500", 
      bannerStyle: "school" 
    },
    { 
      id: "MonsoonSale", 
      name: currentLang === "my" ? "မိုးရာသီ အထူးရောင်းချမှု" : "Monsoon Sale", 
      desc: currentLang === "my" ? "အေးမြသော မိုးအေးအေးနေ့ရက်များအတွက် နွေးထွေးတဲ့ အစားအသောက်နှင့် အဖျော်ယမကာများ" : "Cozy hot brews & sweet comforts for rainy days", 
      color: "from-teal-500 to-cyan-600", 
      bannerStyle: "monsoon" 
    },
    { 
      id: "FlashSale", 
      name: currentLang === "my" ? "ပိတ်ရက် လျှပ်တပြက် အရောင်းမြှင့်တင်မှု" : "Weekend Flash Sale", 
      desc: currentLang === "my" ? "သတ်မှတ်အချိန်အတွင်း အချိန်မီ ဝယ်ယူနိုင်မည့် အထူးလျှော့စျေးများ" : "Limited-time high urgency conversions boost", 
      color: "from-amber-400 to-orange-500", 
      bannerStyle: "flash" 
    },
    { 
      id: "Thingyan", 
      name: currentLang === "my" ? "သင်္ကြန်ရေသဘင် အလှူတော်" : "Thingyan Water Festival", 
      desc: currentLang === "my" ? "ရိုးရာအလှူအစားအစာများနှင့် အပူဒဏ်ပြေစေမည့် အေးမြသော ဖျော်ရည်များ" : "Traditional food & cooling drink promos", 
      color: "from-yellow-400 to-amber-500", 
      bannerStyle: "thingyan" 
    },
    { 
      id: "Christmas", 
      name: currentLang === "my" ? "ခရစ္စမတ် ဆုမွန်ကောင်း" : "Christmas Season", 
      desc: currentLang === "my" ? "မိသားစုအတူတကွ မျှဝေသုံးဆောင်နိုင်မည့် လက်ဆောင်ဗူးအထူးအစီအစဉ်" : "Warm family sharing & gift baskets", 
      color: "from-emerald-500 to-rose-600", 
      bannerStyle: "christmas" 
    },
    { 
      id: "NewYear", 
      name: currentLang === "my" ? "နှစ်သစ်ကူး အကြိုဆင်နွှဲမှု" : "New Year Bash", 
      desc: currentLang === "my" ? "နှစ်ကုန်ခွဲတမ်း အထူးအရောင်းမြှင့်တင်မှုနှင့် အကြွပ်မုန့်ဗူးများ" : "Crunchy snack boards & year-end clearance", 
      color: "from-indigo-500 to-purple-600", 
      bannerStyle: "newyear" 
    },
    { 
      id: "Valentine", 
      name: currentLang === "my" ? "ချစ်သူများနေ့ အမှတ်တရ" : "Valentine's Day", 
      desc: currentLang === "my" ? "ချစ်ခင်ရသူနှင့် အတူတူ သုံးဆောင်နိုင်မည့် ရိုးရာနှစ်ကိုယ်တူ မုန့်ဗူးများ" : "Sweet traditional dessert couple boxes", 
      color: "from-pink-400 to-red-500", 
      bannerStyle: "valentine" 
    },
  ];
  const [selectedPreset, setSelectedPreset] = useState<string>("BackToSchool");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<MarketingInsights | null>(null);
  const [copyLang, setCopyLang] = useState<"en" | "my">("my");
  const [activeTabCopy, setActiveTabCopy] = useState<"facebook" | "instagram" | "ad" | "email">("facebook");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  
  // Custom AI Marketing Campaign selections
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>("3:4");

  // Keep selected product ids synchronized with catalog at start
  useEffect(() => {
    if (selectedProductIds.length === 0 && state.products.length > 0) {
      setSelectedProductIds(state.products.map(p => p.id));
    }
  }, [state.products]);

  // Custom Poster Maker States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [posterTitle, setPosterTitle] = useState<string>("ရိုးရာ နှစ်သစ်ကူး အထူးဗူး");
  const [posterSubtitle, setPosterSubtitle] = useState<string>("၁၅% အထူးလျှော့စျေးယူလိုက်ပါဗျာ");
  const [posterDiscount, setPosterDiscount] = useState<string>("15% OFF");
  const [posterAccent, setPosterAccent] = useState<string>("#eab308"); // Gold
  const [posterBg, setPosterBg] = useState<string>("gradient-gold"); // gradient selection
  const [selectedProduct, setSelectedProduct] = useState<string>(state.products[0]?.id || "");
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiImageLoading, setAiImageLoading] = useState<boolean>(false);
  const [aiImageError, setAiImageError] = useState<string | null>(null);

  const [productImgElement, setProductImgElement] = useState<HTMLImageElement | null>(null);
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string>("");

  useEffect(() => {
    const product = state.products.find(p => p.id === (selectedProduct || state.products[0]?.id));
    if (product && product.image) {
      if (product.image !== lastLoadedUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setProductImgElement(img);
          setLastLoadedUrl(product.image);
        };
        img.onerror = () => {
          setProductImgElement(null);
          setLastLoadedUrl(product.image);
        };
        img.src = product.image;
      }
    } else {
      setProductImgElement(null);
      setLastLoadedUrl("");
    }
  }, [selectedProduct, state.products, lastLoadedUrl]);

  // Derive dynamic analytics from the state
  const totalOrders = state.orders.length;
  const verifiedOrders = state.orders.filter(o => o.status !== "cancelled");
  const calculatedLoss = state.orders.filter(o => o.status === "cancelled").reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);

  // Dynamic product metrics calculations
  const itemsSold: { [name: string]: number } = {};
  verifiedOrders.forEach(o => {
    o.items.forEach(i => {
      itemsSold[i.productName] = (itemsSold[i.productName] || 0) + i.quantity;
    });
  });

  const productMetrics = state.products.map(p => {
    return {
      name: p.name,
      sold: itemsSold[p.name] || 0,
      stock: p.stock,
      price: p.price
    };
  });

  const bestSellers = [...productMetrics].sort((a, b) => b.sold - a.sold).slice(0, 2);
  const slowSellers = [...productMetrics].sort((a, b) => a.sold - b.sold || b.stock - a.stock).slice(0, 2);

  // Customer engagement metrics stats
  const activeConversationsCount = Object.keys(state.sessions).length;
  const liveTakeoverActive = Object.values(state.sessions).filter(s => s.liveTakeoverActive).length;
  const aiRepliedCount = Object.values(state.sessions).filter(s => !s.liveTakeoverActive).length;

  // Render dummy metrics trend over last 6 months (based on actual revenue or realistic intervals)
  const chartData = [
    { label: "Dec", value: Math.round(totalRevenue * 0.4 + 40000) },
    { label: "Jan", value: Math.round(totalRevenue * 0.55 + 65000) },
    { label: "Feb", value: Math.round(totalRevenue * 0.7 + 90000) },
    { label: "Mar", value: Math.round(totalRevenue * 0.85 + 110000) },
    { label: "Apr", value: Math.round(totalRevenue * 1.1 + 180000) }, // Searing high seasonal performance
    { label: "May", value: totalRevenue }
  ];

  // Load backend insights
  const fetchMarketingInsights = async (campaign: string) => {
    setLoading(true);
    try {
      const data = await getAiMarketingInsights(campaign, selectedProductIds);
      if (data.success && data.insights) {
        setInsights(data.insights as unknown as MarketingInsights);
        // Prepopulate text poster configurations based on AI descriptions
        const rec = data.insights.recommendations[0];
        if (rec) {
          setPosterTitle(rec.campaignTitle.substring(0, 28));
          setPosterSubtitle(`Get ${rec.discountPercentage} storewide discount!`);
          setPosterDiscount(rec.discountPercentage || "10% OFF");
          setChecklist(new Array(rec.implementationSteps.length).fill(false));
        }
        
        // Auto select beautiful poster maker accents depending on campaign themes
        if (campaign === "Thingyan") {
          setPosterAccent("#eab308"); // Golden
          setPosterBg("gradient-gold");
        } else if (campaign === "Christmas") {
          setPosterAccent("#ef4444"); // Christmas Red
          setPosterBg("gradient-christmas");
        } else if (campaign === "NewYear") {
          setPosterAccent("#8b5cf6"); // Deep purple
          setPosterBg("gradient-newyear");
        } else if (campaign === "Valentine") {
          setPosterAccent("#ec4899"); // Pink
          setPosterBg("gradient-valentine");
        } else if (campaign === "BackToSchool") {
          setPosterAccent("#0ea5e9"); // Sky Blue
          setPosterBg("gradient-school");
        } else if (campaign === "MonsoonSale") {
          setPosterAccent("#0d9488"); // Teal
          setPosterBg("gradient-monsoon");
        } else if (campaign === "FlashSale") {
          setPosterAccent("#f59e0b"); // Amber
          setPosterBg("gradient-flash");
        } else {
          setPosterAccent("#6366f1"); // Indigo modern
          setPosterBg("gradient-midnight");
        }
      }
    } catch (err) {
      console.error("Could not fetch smart marketing insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingInsights(selectedPreset);
  }, [selectedPreset]);

  // Handle caption clipboard copy feedback
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate poster with Imagen
  const handleGenerateAiImage = async () => {
    if (!insights) return;
    setAiImageLoading(true);
    setAiImageError(null);
    try {
      const data = await getAiMarketingImage(selectedPreset, insights.bannerPrompt);
      if (data.success && data.imageUrl) {
        setAiImage(data.imageUrl);
      } else {
        setAiImageError("Failed to generate marketing graphic.");
      }
    } catch (err) {
      setAiImageError("Could not load marketing image.");
    } finally {
      setAiImageLoading(false);
    }
  };

  // HTML5 Poster drawing inside the Canvas for 100% reliable customized poster graphic creation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Aspect Ratio 3:4 Vertical Poster Size
    const width = 360;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Draw background based on selector gradient
    let bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (posterBg === "gradient-gold") {
      bgGrad.addColorStop(0, "#1e1b4b"); // Indigo midnight
      bgGrad.addColorStop(1, "#120e2e");
    } else if (posterBg === "gradient-christmas") {
      bgGrad.addColorStop(0, "#022c22"); // Dark forest green
      bgGrad.addColorStop(1, "#021c15");
    } else if (posterBg === "gradient-newyear") {
      bgGrad.addColorStop(0, "#0f172a"); // Dark slate starry sky
      bgGrad.addColorStop(1, "#1e1b4b");
    } else if (posterBg === "gradient-valentine") {
      bgGrad.addColorStop(0, "#3e0a16"); // Deep romantic maroon
      bgGrad.addColorStop(1, "#180206");
    } else if (posterBg === "gradient-school") {
      bgGrad.addColorStop(0, "#0c1f30"); // Royal academic dark blue
      bgGrad.addColorStop(1, "#060f18");
    } else if (posterBg === "gradient-monsoon") {
      bgGrad.addColorStop(0, "#042f2e"); // Dark teal monsoon
      bgGrad.addColorStop(1, "#0f172a");
    } else if (posterBg === "gradient-flash") {
      bgGrad.addColorStop(0, "#2c1704"); // Warm charcoal/chocolate-amber flash
      bgGrad.addColorStop(1, "#0c0a09");
    } else {
      bgGrad.addColorStop(0, "#090d16"); // Classic dark metallic
      bgGrad.addColorStop(1, "#1e293b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Render themed decorative background shapes/elements
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.arc(width, 0, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height, 220, 0, Math.PI * 2);
    ctx.fill();

    // Render specialized seasonal stickers/patterns
    ctx.font = "26px system-ui";
    // Emojis removed to keep posters minimal and sleek

    // Outer Thin Accent Border
    ctx.strokeStyle = posterAccent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Campaign Main Title (persuasive center)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(posterTitle, width / 2, 60);

    // Divider Line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 80);
    ctx.lineTo(280, 80);
    ctx.stroke();

    // Subtitle (Burmese / English localized)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(posterSubtitle, width / 2, 105);

    // Product Section Y offset from Y=130 to Y=370
    const product = state.products.find(p => p.id === selectedProduct);
    if (product) {
      // Draw a polished card background frame for the catalog product
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(40, 130, 280, 240, 12);
        ctx.fill();
      } else {
        ctx.fillRect(40, 130, 280, 240);
      }

      // Draw product image inside the frame!
      const imgX = 85;
      const imgY = 145;
      const imgW = 190;
      const imgH = 140;

      if (productImgElement) {
        ctx.save();
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.clip();
        }
        ctx.drawImage(productImgElement, imgX, imgY, imgW, imgH);
        ctx.restore();

        // Outline image with thin elegant border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.stroke();
        } else {
          ctx.strokeRect(imgX, imgY, imgW, imgH);
        }
      } else {
        // Fallback placeholders while loading or without photo
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.fill();
        } else {
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.font = "italic 11px sans-serif";
        ctx.fillText("[ Product Artwork Loading... ]", width / 2, 220);
      }

      // Product Product Name Y=310
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(product.name.replace(/\s*\(.*?\)/g, "").trim(), width / 2, 315);

      // Category and Price unit
      ctx.fillStyle = posterAccent;
      ctx.font = "bold 13px monospace";
      ctx.fillText(`${product.price.toLocaleString()} MMK`, width / 2, 345);

    } else {
      // General fallbacks message if catalog is completely empty
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "italic 12px sans-serif";
      ctx.fillText("[ Select catalog item below to embed ]", width / 2, 230);
    }

    // Dynamic Discount Badge left-aligned
    ctx.fillStyle = posterAccent;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(25, 410, 110, 32, 8);
      ctx.fill();
    } else {
      ctx.fillRect(25, 410, 110, 32);
    }
    ctx.fillStyle = "#000000";
    ctx.font = "extrabold 12px system-ui, sans-serif";
    ctx.fillText(posterDiscount, 80, 431);

    // Small footer note / CTA for Telegram Bot right-aligned
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`@${state.config.telegramBotUsername || "SmeBot"}`, width - 30, 420);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "9px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Order on Telegram Store", width - 30, 436);

  }, [posterTitle, posterSubtitle, posterDiscount, posterAccent, posterBg, selectedProduct, state.products, state.config, productImgElement]);

  // Handle Download HTML5 generated poster
  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `promotion-${selectedPreset}-${posterDiscount.replace(/%/g, "") || "sale"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* STEPPER NAVIGATOR CARD */}
      <div className="bg-white border border-slate-250/70 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs font-mono select-none">
            0{currentStep}
          </div>
          <div className="text-left select-none">
            <span className="text-xs font-extrabold text-slate-900 block font-sans">
              {currentStep === 1 && tSM("stepTitle1")}
              {currentStep === 2 && tSM("stepTitle2")}
              {currentStep === 3 && tSM("stepTitle3")}
            </span>
          </div>
        </div>
        
        {/* STEP BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 select-none w-full md:w-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer font-sans ${
              currentStep === 1 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-105 text-slate-600 hover:bg-slate-200 bg-slate-100"
            }`}
          >
            <span>{tSM("stepBtn1")}</span>
          </button>
          <span className="text-slate-300 text-xs hidden sm:block">➔</span>
          <button
            type="button"
            onClick={() => {
              if (insights) setCurrentStep(2);
            }}
            disabled={!insights}
            title={!insights ? "Please select a theme first" : "Go to Step 2"}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans ${
              currentStep === 2 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-105 text-slate-600 hover:bg-slate-200 bg-slate-100"
            }`}
          >
            <span>{tSM("stepBtn2")}</span>
          </button>
          <span className="text-slate-300 text-xs hidden sm:block">➔</span>
          <button
            type="button"
            onClick={() => {
              if (insights) setCurrentStep(3);
            }}
            disabled={!insights}
            title={!insights ? "Please select a theme first" : "Go to Step 3"}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans ${
              currentStep === 3 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-105 text-slate-600 hover:bg-slate-200 bg-slate-100"
            }`}
          >
            <span>{tSM("stepBtn3")}</span>
          </button>
        </div>
      </div>

      {/* STEP 1: PRESET THEME SELECTION & PRODUCT CHANNELS */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* STEP 1.1: CHOOSE PRODUCTS TO PROMOTE */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-4">
              <div className="flex items-center gap-1.5 justify-start">
                <CheckSquare size={15} className="text-indigo-600 animate-pulse" />
                <h3 className="text-xs font-bold font-mono text-slate-400 tracking-widest uppercase">{tSM("chooseProdTitle")}</h3>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                <div className="space-y-2 max-h-[385px] overflow-y-auto pr-1">
                  {state.products.map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        id={`product-promote-${p.id}`}
                        onClick={() => {
                          if (isChecked) {
                            if (selectedProductIds.length > 1) {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                            }
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer hover:shadow-sm select-none ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-50/40 text-indigo-950"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-755 text-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-slate-200" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                           <span className="text-xs font-bold block truncate leading-tight text-slate-900">{p.name}</span>
                           <span className="text-[10px] font-mono block mt-0.5 text-slate-700">{p.price.toLocaleString()} MMK</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 1.2: SELECT AI CAMPAIGN THEME */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-4">
              <div className="flex items-center gap-1.5 justify-start">
                <Sparkles size={15} className="text-amber-500 animate-pulse" />
                <h3 className="text-xs font-bold font-mono text-slate-400 tracking-widest uppercase">{tSM("chooseThemeTitle")}</h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {PRESET_CAMPAIGNS.map((c) => (
                    <button
                      key={c.id}
                      id={`campaign-preset-${c.id}`}
                      onClick={() => {
                        setSelectedPreset(c.id);
                        setCurrentStep(2);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
                        selectedPreset === c.id
                          ? "border-slate-900 bg-slate-50 text-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-650"
                      }`}
                    >
                      <span className="font-extrabold text-xs block transition-transform group-hover:translate-x-1 text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 leading-normal font-sans font-medium">{c.desc}</span>
                      
                      {selectedPreset === c.id && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: AI STRATEGY PACKAGE & COPYWRITING */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 shadow-sm text-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-sans">{tSM("synthesizing")}</h4>
                <p className="text-xs text-slate-400 animate-pulse font-mono max-w-sm mx-auto">
                  {tSM("generatingFromGemini")}
                </p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              <div className="max-w-3xl mx-auto">
                
                {/* AI HIGH-CONVERSION SOCIAL COPYWRITING */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={16} className="text-indigo-650" />
                      <h3 className="text-sm font-black text-slate-900">{tSM("socialCopyTitle")}</h3>
                    </div>
                    
                    {/* Language Toggler */}
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shrink-0 select-none">
                      <button
                        onClick={() => setCopyLang("en")}
                        className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all ${
                          copyLang === "en" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setCopyLang("my")}
                        className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all ${
                          copyLang === "my" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        မြန်မာ
                      </button>
                    </div>
                  </div>

                  {/* Caption tabs selectors */}
                  <div className="flex border-b border-slate-150 gap-2 shrink-0 overflow-x-auto select-none no-scrollbar">
                    {(["facebook", "instagram", "ad", "email"] as const).map((tab) => {
                      const labels = {
                        facebook: currentLang === "my" ? "Facebook စာသား" : "FB Caption",
                        instagram: currentLang === "my" ? "Instagram ခေါင်းစဉ်" : "IG Headline",
                        ad: currentLang === "my" ? "ကြော်ငြာစာသား" : "Ad Copy",
                        email: currentLang === "my" ? "အီးမေးလ် စာသား" : "Email Copy"
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTabCopy(tab)}
                          className={`pb-2 px-1 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                            activeTabCopy === tab 
                              ? "border-indigo-600 text-indigo-700" 
                              : "border-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Render Selected Tab content */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 relative group min-h-[160px]">
                    <p className="text-xs text-slate-750 leading-relaxed font-sans whitespace-pre-line select-all">
                      {activeTabCopy === "facebook" && (insights.copywriting?.facebookCaption?.[copyLang] || "No Facebook template generated")}
                      {activeTabCopy === "instagram" && (insights.copywriting?.instagramCaption?.[copyLang] || "No Instagram template generated")}
                      {activeTabCopy === "ad" && (insights.copywriting?.adCopy?.[copyLang] || "No Ad copy template generated")}
                      {activeTabCopy === "email" && (insights.copywriting?.email?.[copyLang] || "No Email template generated")}
                    </p>

                    {/* Tags section */}
                    {insights.copywriting?.hashtags && (activeTabCopy === "facebook" || activeTabCopy === "instagram") && (
                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <span className="text-[10px] text-indigo-650 font-extrabold block">{tSM("hashtagCluster")}</span>
                        <span className="text-[11px] font-mono text-slate-500 block mt-1 leading-snug">{insights.copywriting.hashtags}</span>
                      </div>
                    )}

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => {
                        let text = "";
                        if (activeTabCopy === "facebook") text = insights.copywriting?.facebookCaption?.[copyLang] || "";
                        if (activeTabCopy === "instagram") text = insights.copywriting?.instagramCaption?.[copyLang] || "";
                        if (activeTabCopy === "ad") text = insights.copywriting?.adCopy?.[copyLang] || "";
                        if (activeTabCopy === "email") text = insights.copywriting?.email?.[copyLang] || "";
                        copyText(text, activeTabCopy);
                      }}
                      className="absolute bottom-2.5 right-2.5 bg-white text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      {copiedKey === activeTabCopy ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span className="text-emerald-700 font-bold">{tSM("copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>{tSM("copy")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-sans"
                >
                  {tSM("backToTheme")}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                >
                  {tSM("configPosters")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
              <Sparkles size={30} className="text-amber-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-950 font-mono tracking-widest uppercase mb-1">{tSM("noThemeSelected")}</h4>
              <p className="text-xs text-slate-400">{tSM("chooseThemeFirst")}</p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                {tSM("goToStep1")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CREATIVE SOCIAL POSTERS & AI IMAGEN GENERATOR */}
      {/* STEP 3: CREATIVE SOCIAL POSTERS */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 shadow-sm text-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 font-sans">{tSM("updatingCreative")}</h4>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              
              {/* HTML5 POSTER STUDIO BUILDER CARD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon size={16} className="text-indigo-650" />
                    <h3 className="text-sm font-black text-slate-900">{tSM("posterStudioTitle")}</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">Phase 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Vertical Canvas Preview */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200/60 relative">
                    <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2 select-none">
                      {tSM("posterLivePreview")}
                    </span>
                    <div className="w-full max-w-[280px] drop-shadow-xl font-sans">
                      <canvas 
                        ref={canvasRef} 
                        className="w-full rounded-xl border border-slate-200/80 select-none bg-slate-950 aspect-[3/4]" 
                      />
                    </div>
                  </div>

                  {/* Right Column: Custom poster typography and selection tools */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tSM("posterTitleLabel")}</label>
                        <input 
                          type="text" 
                          value={posterTitle} 
                          onChange={(e) => setPosterTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tSM("promoDiscountLabel")}</label>
                        <input 
                          type="text" 
                          value={posterDiscount} 
                          onChange={(e) => setPosterDiscount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tSM("subheadingLabel")}</label>
                      <input 
                        type="text" 
                        value={posterSubtitle} 
                        onChange={(e) => setPosterSubtitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-sans text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tSM("catalogProductLabel")}</label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        >
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name.replace(/\s*\(.*?\)/g, "").trim()} ({p.price.toLocaleString()} MMK)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">{tSM("themeTemplateLabel")}</label>
                        <select
                          value={posterBg}
                          onChange={(e) => {
                            setPosterBg(e.target.value);
                            // Match presets
                            if (e.target.value === "gradient-gold") setPosterAccent("#eab308");
                            else if (e.target.value === "gradient-christmas") setPosterAccent("#ef4444");
                            else if (e.target.value === "gradient-newyear") setPosterAccent("#8b5cf6");
                            else if (e.target.value === "gradient-valentine") setPosterAccent("#ec4899");
                            else if (e.target.value === "gradient-school") setPosterAccent("#0ea5e9");
                            else if (e.target.value === "gradient-monsoon") setPosterAccent("#0d9488");
                            else if (e.target.value === "gradient-flash") setPosterAccent("#f59e0b");
                            else setPosterAccent("#6366f1");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="gradient-school">{tSM("styleStudents")}</option>
                          <option value="gradient-monsoon">{tSM("styleCozy")}</option>
                          <option value="gradient-flash">{tSM("styleFlash")}</option>
                          <option value="gradient-gold">{tSM("styleThingyan")}</option>
                          <option value="gradient-christmas">{tSM("styleChristmas")}</option>
                          <option value="gradient-newyear">{tSM("styleNewYear")}</option>
                          <option value="gradient-valentine">{tSM("styleValentine")}</option>
                          <option value="gradient-midnight">{tSM("styleGeneral")}</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={downloadPoster}
                      className="w-full mt-4 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer box-border font-sans shadow-sm"
                    >
                      <Download size={14} />
                      {tSM("downloadFlyer")}
                    </button>
                  </div>
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-4 select-none font-sans">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {tSM("backToStrategy")}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {tSM("startNewCampaign")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center font-sans">
              <Sparkles size={30} className="text-amber-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-950 font-mono tracking-widest uppercase mb-1">{tSM("noActiveTheme")}</h4>
              <p className="text-xs text-slate-400">{tSM("chooseThemeFirst")}</p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                {tSM("goToStep1")}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
