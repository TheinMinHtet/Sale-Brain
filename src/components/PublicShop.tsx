"use client";

import { useState, useEffect } from "react";
import { ShopStorefront, type PublicShop as PublicShopData } from "./ShopStorefront";
import { supabase } from "../utils/supabase";
import { Product, DeliveryZone } from "../types";

export function PublicShop({ shopId }: { shopId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<PublicShopData | null>(null);

  useEffect(() => {
    async function fetchShop() {
      try {
        // 1. Resolve shop row from public shop_id (varchar)
        const { data: shopRow, error: shopErr } = await supabase
          .from("shops")
          .select("id, owner_id, shop_name, owner_name, phone, address, onboarding_profile")
          .eq("shop_id", shopId)
          .maybeSingle();

        if (shopErr || !shopRow) throw new Error("Shop not found");

        // 2. Fetch products — products.shop_id stores the owner_id UUID
        const { data: productRows, error: prodErr } = await supabase
          .from("products")
          .select("id, name, category, price, description, stock, image")
          .eq("shop_id", shopRow.owner_id);

        if (prodErr) throw prodErr;

        const products: Product[] = (productRows ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category ?? "",
          price: Number(p.price),
          description: p.description ?? "",
          stock: p.stock ?? 0,
          image: p.image ?? "",
        }));

        // 3. Try edge function for delivery zones (non-fatal)
        let deliveryZones: DeliveryZone[] = [];
        try {
          const { data: edgeData } = await supabase.functions.invoke("shop", {
            body: { action: "get-state", shopId },
          });
          if (edgeData?.deliveryZones) deliveryZones = edgeData.deliveryZones;
        } catch {
          // ignore — delivery zones are optional
        }

        const profile = shopRow.onboarding_profile as Record<string, string> | null;
        setShop({
          shopId,
          businessName: shopRow.shop_name ?? "Shop",
          description: profile?.description ?? "Welcome to our shop!",
          paymentInfo: profile?.payment_method ?? "We accept KPay and WavePay.",
          deliveryInfo: profile?.delivery_method ?? "Delivery available across Yangon.",
          products,
          deliveryZones,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Shop not found";
        console.error("Failed to load shop:", err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, [shopId]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#f8fafc] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading Shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="h-[100dvh] bg-[#f8fafc] flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-950 mb-2">Shop Not Found</h2>
          <p className="text-sm text-slate-500 mb-8">The shop link might be expired or incorrect. Please check with the owner.</p>
          <a href="/" className="inline-block bg-slate-950 text-white px-8 py-3 rounded-full text-sm font-bold transition hover:bg-slate-800">
            Go to Sales Brain AI
          </a>
        </div>
      </div>
    );
  }

  return <ShopStorefront shop={shop} />;
}
