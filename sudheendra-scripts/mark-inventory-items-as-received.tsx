import { getLogger, request } from "./utils";

const logger = getLogger();

async function markAsReceived(supplyDeliveryIds: string[]) {
  await request("/api/v1/batch_requests/", "POST", {
    requests: supplyDeliveryIds.map((id) => ({
      url: `/api/v1/supply_delivery/${id}/update_as_receiver/`,
      method: "PUT",
      reference_id: `mark-as-received-${id}`,
      body: {
        status: "completed",
        supplied_item_condition: "normal",
      },
    })),
  });
  logger(`Marked ${supplyDeliveryIds.length} supply deliveries as received`);
}

const PAGE_SIZE = 20;

async function getSupplyDeliveryIds(page: number) {
  logger(`Getting supply delivery ids for page ${page}`);

  const queryString = new URLSearchParams({
    offset: "0",
    limit: `${PAGE_SIZE}`,
    status: "in_progress",
    origin_isnull: "true",
    facility: process.env.FACILITY_ID!,
    destination: process.env.LOCATION_ID!,
  }).toString();

  const response = await request<any>(
    `/api/v1/supply_delivery/?${queryString}`,
    "GET",
  );
  return response.results.map((item) => item.id);
}

async function main() {
  let page = 1;
  while (true) {
    const ids = await getSupplyDeliveryIds(page);
    await markAsReceived(ids);
    if (ids.length < PAGE_SIZE) {
      return;
    }
    page += 1;
  }
}

main();
