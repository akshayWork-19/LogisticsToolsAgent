import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Three deliberately trivial, deterministic mock tools. The point of
 * this project isn't the tools themselves — it's that the LLM decides
 * WHICH one to call (or whether to call any at all), per turn, based
 * on the conversation so far. In every earlier project, YOU wrote the
 * if/else that decided the next step. Here, that decision moves into
 * the model's own tool-calling output.
 */

const getOrderStatus = tool(
  async ({ orderId }) => {
    const statuses = [
      "placed",
      "picket_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];
    const lastdigit = parseInt(orderId.slice(-1), 10) || 0;
    const status = statuses[lastdigit % statuses.length];
    return `Order ${orderId} status:${status} `;
  },
  {
    name: "getOrderStatus",
    description:
      "Look up the current delivery status of an order by its order ID.",
    schema: z.object({
      orderId: z.string().describe("The order ID,e.g. 'ORD-2234"),
    }),
  },
);

const calculateETA = tool(
  async ({ originPincode, destPincode }) => {
    // Mock "distance": absolute difference between pincodes, scaled
    // down. Real logic would call a routing/distance API.
    const distance =
      Math.abs(parseInt(originPincode, 10) - parseInt(destPincode, 10)) % 50;
    const hours = Math.max(2, Math.round(distance / 5));
    return ` Estimated delivery time from ${originPincode} to ${destPincode} :${hours} hours`;
  },
  {
    name: "calculateETA",
    description: "Estimate delivery time between two delhi NCR pincodes",
    schema: z.object({
      originPincode: z.string().describe("6-digit origin pincode"),
      destPincode: z.string().describe("6-digit destination pincode"),
    }),
  },
);

const checkCourierAvailablity = tool(
  async ({ area }) => {
    // Mock roster — swap for a real courier-partner lookup against
    // whatever DEL-EX's partner dashboard actually tracks.
    const roster: Record<string, string[]> = {
      dwarka: ["courier-12", "courier-45"],
      "cannaught place": ["courier-08"],
      rohini: ["courier-19", "courier-27", "courier-33"],
    };

    const available = roster[area.toLowerCase()] ?? [];
    return available.length > 0
      ? `Available couriers in ${area}:${available.join(",")}`
      : `No couriers currently avilable in ${area}`;
  },
  {
    name: "checkCourierAvailablity",
    description:
      "Check which couriers are currently available in a given Delhi NCR area",
    schema: z.object({
      area: z.string().describe("Area name, e.g. 'Dwarka', 'Rohini'"),
    }),
  },
);

export const tools = [getOrderStatus, calculateETA, checkCourierAvailablity];
