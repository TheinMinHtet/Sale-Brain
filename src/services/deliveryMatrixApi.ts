import { DeliveryZone, DeliveryMatrixResponse, DeliveryZoneFormData } from "../types";
import * as ls from "./deliveryMatrixLocalStorage";

export async function fetchDeliveryMatrix(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  _address: string = ""
): Promise<DeliveryMatrixResponse> {
  return ls.fetchDeliveryMatrixLS(page, limit, search);
}

export async function addDeliveryZone(zone: DeliveryZoneFormData): Promise<DeliveryZone> {
  return ls.addDeliveryZoneLS(zone);
}

export async function updateDeliveryZone(
  id: string,
  zone: Partial<DeliveryZoneFormData>
): Promise<DeliveryZone> {
  return ls.updateDeliveryZoneLS(id, zone);
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  return ls.deleteDeliveryZoneLS(id);
}