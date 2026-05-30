import type { SystemState } from "../types";

export function createEmptyShopState(): SystemState {
  return {
    config: {
      shopName: "",
      ownerName: "",
      phone: "",
      currency: "MMK",
      telegramBotToken: "",
      telegramBotUsername: "Jjkql_bot",

      onboardingCompleted: false,
    },
    products: [],
    deliveryZones: [],
    orders: [],
    sessions: {},
  };
}
