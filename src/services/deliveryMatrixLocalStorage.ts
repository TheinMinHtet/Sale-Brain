import { DeliveryZone, DeliveryMatrixResponse, DeliveryZoneFormData } from "../types";
import { getState, mutateDeliveryZone } from "./clientStore";

export async function fetchDeliveryMatrixLS(
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<DeliveryMatrixResponse> {
  const state = getState();
  let zones = state.deliveryZones;

  if (search) {
    const lowerSearch = search.toLowerCase();
    zones = zones.filter(z => 
      z.township_name.toLowerCase().includes(lowerSearch)
    );
  }

  const totalRecords = zones.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const offset = (page - 1) * limit;
  const pagedData = zones.slice(offset, offset + limit);

  return {
    data: pagedData,
    pagination: {
      total_records: totalRecords,
      current_page: page,
      limit: limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    }
  };
}

export async function addDeliveryZoneLS(zone: DeliveryZoneFormData): Promise<DeliveryZone> {
  const state = mutateDeliveryZone("add", { zone });
  return state.deliveryZones[0];
}

export async function updateDeliveryZoneLS(
  id: string,
  zoneData: Partial<DeliveryZoneFormData>
): Promise<DeliveryZone> {
  const state = mutateDeliveryZone("update", { id, zone: zoneData as DeliveryZoneFormData });
  const updated = state.deliveryZones.find(z => z.id === id);
  if (!updated) throw new Error("Delivery zone not found");
  return updated;
}

export async function deleteDeliveryZoneLS(id: string): Promise<void> {
  mutateDeliveryZone("delete", { id });
}
