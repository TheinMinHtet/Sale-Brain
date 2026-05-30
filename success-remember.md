# ✅ Success Playbook — Repeatable Implementation Steps

> **Purpose:** This document records **proven, working implementations** so agents can repeat the same steps without rediscovering schema, file layout, or integration patterns. Pair with `lesson-learned.md` (what to avoid) and `AGENTS.md` (project conventions).
>
> **How to Use:**
> - Before adding a similar feature (onboarding → DB, new Supabase table wiring, profile JSONB), scan the **Success Log** and follow the numbered steps for that entry.
> - After a feature ships and is verified in Supabase/UI, append a new **SUCCESS-00X** entry using the template at the bottom.
> - Prefer copying existing service modules (`shopRecord.ts`) over inventing parallel patterns.

---

## 🚀 Quick Reference — Proven Patterns

### Supabase shop + onboarding
- **Rule:** Use table `public.shops`, not `business_onboarding`, as source of truth for completion and profile.
- **Rule:** `shop_name` and `owner_name` are columns on `shops`; everything else from the wizard goes in `onboarding_profile` (jsonb).
- **Rule:** Set `onboarding_completed = true` only when the user finishes the full wizard (final submit).
- **Rule:** RLS policy: `auth.uid() = owner_id` — always pass `user.id` from `useAuth()` as `owner_id`.
- **Rule:** Upsert pattern: `getShopForOwner` → update by `id` if row exists, else `insert` with `owner_id`.

### Frontend integration
- **Rule:** DB access lives in `src/services/*.ts`, not inside large components.
- **Rule:** Types for DB shapes live in `src/types.ts` (`OnboardingProfile`, `ShopRecord`).
- **Rule:** `App.tsx` `fetchState` merges Postgres shop row into `storeState.config` before rendering dashboard.
- **Rule:** `Onboarding.tsx` calls service on final step only; `onComplete` still updates local state + storage for instant UX.

### Verification
- **Rule:** After implementation, confirm in Supabase Table Editor: `shops` row for test user has `onboarding_completed`, `shop_name`, `owner_name`, populated `onboarding_profile`.
- **Rule:** “Edit business profile” must call `setShopOnboardingCompleted(userId, false)` so wizard shows again.
- **Rule:** Every key in `onboarding_profile` must be collected in the wizard **or** explicitly round-tripped via `shopRecordToFormData` + `saveShopOnboarding`. Never write `""` for keys the UI does not collect—edits will wipe existing jsonb values.
- **Rule:** `buildOnboardingProfile(form, existingProfile)` merges with the previous profile when a payload field is empty, so partial API payloads do not erase stored data.

---

## 📋 Success Log

| ID | Title | Date | Key Files |
|----|-------|------|-----------|
| SUCCESS-001 | Onboarding → `shops` table (Postgres) | 2026-05-29 | `shopRecord.ts`, `Onboarding.tsx`, `App.tsx`, `types.ts` |
| SUCCESS-002 | Full `onboarding_profile` round-trip (no missing fields) | 2026-05-29 | `shopRecord.ts`, `Onboarding.tsx`, `types.ts` |
| SUCCESS-003 | Public shop page fetches products directly from Supabase | 2026-05-30 | `PublicShop.tsx` |
| SUCCESS-004 | State-driven Myanmar chatbot with local fallback (no API key) | 2026-05-30 | `ShopChatbot.tsx` |

---

## 📝 Documented Successes

## [SUCCESS-001]: Persist onboarding to `shops` (Sales_brain / Supabase)

* **Goal:** Save wizard data to Postgres: shop name + owner on `shops`; profile fields in `onboarding_profile`; flip `onboarding_completed` when done.
* **Database (verified via Supabase MCP):**

| UI / business field | Storage |
|---------------------|---------|
| Business / shop name | `shops.shop_name` |
| Owner name | `shops.owner_name` |
| Business type, platform, goals, ops fields, etc. | `shops.onboarding_profile` (jsonb keys below) |
| Wizard finished | `shops.onboarding_completed = true` |

* **`onboarding_profile` jsonb keys:**

```json
{
  "business_type": "",
  "mainly_sell": "",
  "main_customer": "",
  "age_group": "",
  "matter_most": "",
  "marketing_method": "",
  "business_goal": "",
  "selling_platform": "",
  "weekly_order_volume": "",
  "payment_method": "",
  "delivery_method": "",
  "bot_personality": ""
}
```

* **Implementation steps (repeat in order):**

1. **Inspect live schema** — Use Supabase `list_tables` (verbose) or SQL. Confirm column names (`shop_name`, not `shop_names`). Note RLS: `auth.uid() = owner_id`.

2. **Add types** — In `src/types.ts`:
   - `OnboardingProfile` (jsonb shape)
   - `ShopRecord` (selected columns from `shops`)

3. **Create service** — `src/services/shopRecord.ts`:
   - `buildOnboardingProfile(form, existingProfile?)` — map camelCase form → snake_case jsonb; merge with `existing?.onboarding_profile` when a payload value is empty
   - `shopRecordToFormData(shop)` — map **all** jsonb keys back into `OnboardingFormState` for edit mode
   - `getShopForOwner(ownerId)` — `.eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(1).maybeSingle()`
   - `saveShopOnboarding(ownerId, form)` — `getShopForOwner` first, then `buildOnboardingProfile(form, existing?.onboarding_profile)`; update by `id` or insert with `owner_id`
   - `setShopOnboardingCompleted(ownerId, boolean)` — for “edit profile” reset

4. **Wire wizard submit** — In `src/components/Onboarding.tsx`:
   - Collect `owner_name`, `main_customer`, and `age_group` in form state (step 1 validation)
   - On final step: `await saveShopOnboarding(user.id, { shopName, ownerName, mainCustomer, ageGroup, mainlySell, matterMost, marketingMethod, ... })`
   - `onComplete({ shopName, ownerName }, aiSummary)` for App local state
   - Do **not** write to `business_onboarding` for new work

5. **Wire app load** — In `src/App.tsx` `fetchState`:
   - After `getShopState(user.id)`, call `getShopForOwner(user.id)`
   - Sync `config.onboardingCompleted`, `config.shopName`, `config.ownerName` from shop row

6. **Wire profile reset** — “Edit business profile” button:
   - `setShopOnboardingCompleted(user.id, false)` instead of updating `business_onboarding`

7. **Keep storage + API path** — `onComplete` in App still:
   - Patches local `storeState` immediately
   - `invokeApi('onboarding', ...)` + `saveShopState` for JSON bucket / Telegram setup
   - Postgres `shops` row remains source of truth for **completion gate** (`!config.onboardingCompleted` → show wizard)

8. **Verify**
   - Log in as test user → complete 3-step wizard
   - Supabase: one `shops` row with `owner_id = user.id`, `onboarding_completed = true`
   - Reload app → dashboard loads (no wizard)
   - “Edit business profile” → wizard returns; `onboarding_completed = false` in DB

* **Reference code locations:**

```text
src/types.ts              → OnboardingProfile, ShopRecord
src/services/shopRecord.ts → getShopForOwner, saveShopOnboarding, setShopOnboardingCompleted
src/components/Onboarding.tsx → handleFinalSubmit → saveShopOnboarding
src/App.tsx               → fetchState merge; edit-profile reset
```

* **Field mapping from wizard (current UI):**

| Form field (`Onboarding.tsx`) | Profile key / column |
|------------------------------|----------------------|
| `business_name` | `shops.shop_name` |
| `owner_name` | `shops.owner_name` |
| `business_category` | `business_type`; also sets `mainly_sell` when unchanged from prior category |
| `main_customer` | `main_customer` |
| `age_group` | `age_group` |
| `selling_platform` | `selling_platform`; also sets `marketing_method` when unchanged from prior platform |
| `weekly_order_volume` | `weekly_order_volume` |
| `payment_method` | `payment_method` |
| `delivery_method` | `delivery_method` |
| `business_goal` | `business_goal` |
| `bot_personality` | `bot_personality`; also sets `matter_most` when unchanged from prior personality |

* **Extending with new wizard fields:** Add to `OnboardingFormState` → `shopRecordToFormData` → pass in `OnboardingFormPayload` → map in `buildOnboardingProfile`. No migration needed if stored in jsonb. Always round-trip load + save; do not leave keys only in `buildOnboardingProfile` defaults.

* **Enforcement rule:** Any new onboarding or shop-profile feature MUST go through `shopRecord.ts` and `shops` table unless product explicitly requires a new table.

---

## [SUCCESS-002]: Full `onboarding_profile` round-trip (fix missing fields on create/edit)

* **Goal:** Stop `main_customer` and `age_group` (and derived keys) from saving as `""` on create or being wiped on edit when the user had previously set them.
* **Symptom:** Supabase `onboarding_profile` showed empty `age_group` / `main_customer` even though other keys were filled; re-saving the wizard overwrote the whole jsonb object with defaults.

* **Root cause:**
  - `OnboardingFormState` omitted several jsonb keys.
  - `shopRecordToFormData` did not map them back for edit mode.
  - `handleFinalSubmit` did not pass `mainCustomer`, `ageGroup`, etc. to `saveShopOnboarding`.
  - `buildOnboardingProfile` always wrote `""` for unmapped optional fields.

* **Implementation steps (repeat in order):**

1. **Extend form type** — In `src/types.ts`, add every jsonb key to `OnboardingFormState` (`mainly_sell`, `main_customer`, `age_group`, `marketing_method`, `matter_most`).

2. **Load for edit** — In `shopRecordToFormData`, map each `onboarding_profile` key with sensible fallbacks (e.g. `mainly_sell` ← `business_type`, `matter_most` ← `bot_personality`).

3. **Merge on save** — Change `buildOnboardingProfile(form, existing?)` to prefer non-empty payload values, then fall back to `existing` profile values, then defaults.

4. **Save with context** — In `saveShopOnboarding`, call `getShopForOwner` before build, then `buildOnboardingProfile(form, existing?.onboarding_profile)`.

5. **Collect in UI** — In `Onboarding.tsx` step 1, add RadioGroups for **Main Customer Type** and **Target Age Group**; require them in `isStepValid`.
   - Sync `mainly_sell` when category changes (if still tied to old category).
   - Sync `marketing_method` / `matter_most` when platform / personality changes the same way.

6. **Submit all fields** — Pass `mainCustomer`, `ageGroup`, `mainlySell`, `marketingMethod`, `matterMost` in `saveShopOnboarding` payload.

7. **Verify**
   - Complete wizard → Supabase jsonb has **no empty** `main_customer` or `age_group`.
   - Edit profile → step 1 shows saved customer + age selections.
   - Save edit → jsonb values persist (not reset to `""`).

* **Reference code locations:**

```text
src/types.ts              → OnboardingFormState (full profile shape)
src/services/shopRecord.ts → shopRecordToFormData, buildOnboardingProfile(form, existing?)
src/components/Onboarding.tsx → mainCustomers / ageGroups options; step 1 validation + submit payload
```

* **Enforcement rule:** If `onboarding_profile` defines a key, the wizard must either collect it or `shopRecordToFormData` + merge-on-save must preserve it. Never add jsonb keys only in `buildOnboardingProfile` without UI or round-trip mapping.

---

## [SUCCESS-003]: Public shop page fetches products directly from Supabase

* **Goal:** `/shop/<shopId>` public page shows the shop's products without relying on the Edge Function.

* **Root cause of original failure (two bugs):**
  1. `PublicShop.tsx` called only the `shop` Edge Function for products — if it failed, products were empty.
  2. After switching to direct Supabase queries, `owner_id` was missing from the `.select()` string, so `shopRow.owner_id` was `undefined` and the products query silently returned nothing.

* **Schema facts (verified via MCP):**
  - `shops.shop_id` (varchar) — the public URL token
  - `shops.id` (uuid) — internal primary key
  - `shops.owner_id` (uuid) — the auth user UUID
  - `products.shop_id` (uuid) — stores the **owner_id**, NOT `shops.id`

* **Implementation steps (repeat in order):**

1. Query `shops` — select `id, owner_id, shop_name, owner_name, phone, address, onboarding_profile` where `shop_id = <url token>`. **Must include `owner_id`.**
2. Query `products` — `.eq("shop_id", shopRow.owner_id)` (not `shopRow.id`).
3. Call Edge Function only for delivery zones (non-fatal, wrapped in try/catch).
4. Map `productRows` to `Product[]` with `Number(p.price)` cast.

* **Reference code:** `src/components/PublicShop.tsx`

* **Enforcement rule:** When fetching products for a public shop, always join via `products.shop_id = shops.owner_id`. Never use `shops.id` for this join. Always include `owner_id` in the shops `.select()`.

---

## [SUCCESS-004]: State-driven Myanmar chatbot with local rule-based fallback

* **Goal:** `ShopChatbot` follows a conversation state machine and works even when `VITE_GEMINI_API_KEY` is missing or the Edge Function is down.

* **Architecture (3-tier fallback):**
  1. Supabase Edge Function (`shop` → `action: "chat"`) — primary
  2. Direct Gemini API fetch with `VITE_GEMINI_API_KEY` — secondary
  3. `buildLocalReply()` rule-based Myanmar responses — always-available fallback

* **Conversation states:** `introduction → intent_classification → advertise / show_product → will_it_buy → stock_check → transaction → terminate_warm / terminate_notify`

* **Tag protocol** — bot appends hidden tags stripped before display:
  - `[STATE:x]` → calls `setConvState(x)`
  - `[ACTION:ADD, ID:x]` → adds product to cart
  - `[ACTION:CHECKOUT]` → transitions to `transaction`
  - `[PREF:LIKE, ID:x]` / `[PREF:DISLIKE, ID:x]` → saved to localStorage

* **User preference memory:** `localStorage` key `shop_prefs_<shopId>` — persists liked/disliked products, past orders, last visit across sessions; injected into system prompt for personalization.

* **`buildLocalReply()` keyword routing (no API needed):**
  - Delivery/shipping keywords → COD urban / KPay regional answer
  - Payment keywords → payment methods list
  - Checkout/order/buy → cart total + payment guidance
  - Product name match → price + stock + `[PREF:LIKE]` tag
  - Greeting → welcome + top 2 product highlights
  - Product/catalog keywords → full product list

* **Reference code:** `src/components/ShopChatbot.tsx` — `buildSystemPrompt()`, `buildLocalReply()`, `applyTags()`, `sendMessage()`

* **Enforcement rule:** Never show a raw error message to the customer. If both Edge Function and Gemini fail, always fall through to `buildLocalReply()`. The API key check must route to local fallback, not an error string.

---

## 🔄 Repeat Loop

```
[Ship verified feature] ──> [Append SUCCESS-00X here]
                                    │
                                    ▼
[Similar task later]  <── [Agent reads success-remember.md] <── [Copy steps + files]
```

---

## 🔧 How to Add New Successes

When an implementation is **done and verified**, document it with this format:

```markdown
## [SUCCESS-00X]: [Short title]

* **Goal:** [What shipped]
* **Database / API:** [Tables, columns, endpoints]
* **Implementation steps (repeat in order):** [Numbered list]
* **Reference code locations:** [Paths]
* **Verification:** [How to confirm it works]
* **Enforcement rule:** [When to reuse this pattern]
```

Then add a row to the **Success Log** table at the top.

---

## 📝 Contribution Guidelines

1. **Only document what worked** — include steps that were run and verified (Supabase row, UI flow).
2. **Be copy-paste friendly** — file paths, table/column names, function names.
3. **Keep in sync with schema** — if migrations change column names, update the success entry the same PR.
4. **Cross-link failures** — if a success pattern has a common pitfall, add a pointer to `lesson-learned.md` (e.g. ISSUE-004 for Burmese in PowerShell).
5. **Do not duplicate anti-patterns here** — use `lesson-learned.md` for “DO NOT”; use this file for “DO THIS”.

---

*Last Updated: 2026-05-30 (SUCCESS-004: state-driven Myanmar chatbot + local fallback)*
*Maintained by: Development Team*
