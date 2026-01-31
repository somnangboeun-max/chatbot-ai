/**
 * Bot Response Engine
 * Story 4.5: Rules-Based FAQ Matching Engine
 *
 * Main orchestrator: receives a customer message + tenant context,
 * determines intent via rules, queries database for data, and
 * returns a formatted Khmer response with confidence score.
 *
 * Critical: prices, hours, location ALWAYS come from database.
 * This engine NEVER guesses or approximates business information.
 */

import type { BotResponse } from "./types";
import { classifyIntent } from "./rules";
import {
  findProductByName,
  getAllProducts,
  getBusinessHours,
  getBusinessAddress,
  getBusinessPhone,
  getBusinessName,
} from "./queries";
import {
  formatPriceResponse,
  formatProductListResponse,
  formatHoursResponse,
  formatAddressResponse,
  formatPhoneResponse,
  formatNoMatchResponse,
  formatProductNotFoundResponse,
  formatNoDataResponse,
  getGreetingResponse,
  getFarewellResponse,
  getClosedNowResponse,
  getErrorResponse,
} from "./templates";

/**
 * Process an incoming customer message and generate a rules-based response.
 *
 * Flow:
 * 1. Classify intent using keyword rules
 * 2. Query database for relevant data
 * 3. Format response in Khmer with proper politeness markers
 * 4. Return response with confidence score
 *
 * This function never throws — returns low-confidence response on errors.
 */
export async function processMessage(
  tenantId: string,
  customerMessage: string
): Promise<BotResponse> {
  try {
    const matchResult = classifyIntent(customerMessage);

    switch (matchResult.intent) {
      case "price_query":
        return await handlePriceQuery(tenantId, matchResult.extractedEntity);

      case "hours_query":
        return await handleHoursQuery(tenantId);

      case "location_query":
        return await handleLocationQuery(tenantId);

      case "phone_query":
        return await handlePhoneQuery(tenantId);

      case "greeting": {
        const businessName = await getBusinessName(tenantId);
        return {
          responseText: getGreetingResponse(businessName ?? undefined),
          confidence: "high",
          intent: "greeting",
        };
      }

      case "farewell":
        return {
          responseText: getFarewellResponse(),
          confidence: "high",
          intent: "farewell",
        };

      case "general_faq":
      default:
        return {
          responseText: formatNoMatchResponse(),
          confidence: "low",
          intent: "general_faq",
        };
    }
  } catch (error) {
    console.error("[ERROR] [BOT] Engine processing failed:", {
      tenantId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      responseText: getErrorResponse(),
      confidence: "low",
      intent: "general_faq",
    };
  }
}

async function handlePriceQuery(
  tenantId: string,
  extractedEntity: string | undefined
): Promise<BotResponse> {
  // No product name extracted — return full product list
  if (!extractedEntity) {
    const products = await getAllProducts(tenantId);
    if (products.length === 0) {
      return {
        responseText: formatNoDataResponse("products"),
        confidence: "low",
        intent: "price_query",
      };
    }
    return {
      responseText: formatProductListResponse(products),
      confidence: "medium",
      intent: "price_query",
    };
  }

  // Try to find specific product
  const product = await findProductByName(tenantId, extractedEntity);
  if (product) {
    return {
      responseText: formatPriceResponse(product.name, product.price, product.currency),
      confidence: "high",
      intent: "price_query",
      matchedProduct: product.name,
    };
  }

  // Product not found — return list with "not found" message
  const allProducts = await getAllProducts(tenantId);
  if (allProducts.length > 0) {
    return {
      responseText: formatProductNotFoundResponse(extractedEntity, allProducts),
      confidence: "medium",
      intent: "price_query",
    };
  }

  return {
    responseText: formatNoDataResponse("products"),
    confidence: "low",
    intent: "price_query",
  };
}

/** Khmer day names for closed-now template */
const KHMER_DAY_NAMES: Record<string, string> = {
  monday: "ច័ន្ទ",
  tuesday: "អង្គារ",
  wednesday: "ពុធ",
  thursday: "ព្រហស្បតិ៍",
  friday: "សុក្រ",
  saturday: "សៅរ៍",
  sunday: "អាទិត្យ",
};

const DAY_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Check if business is currently open based on hours schedule.
 * Returns next opening info if closed.
 */
function getClosedInfo(
  hours: Record<string, { open: string; close: string }>
): { isClosed: boolean; nextOpenTime?: string; nextOpenDay?: string } {
  const now = new Date();
  const currentDay = DAY_ORDER[now.getDay()]!;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Check if currently open (today's schedule)
  const todaySchedule = hours[currentDay];
  if (todaySchedule) {
    if (todaySchedule.close < todaySchedule.open) {
      // Cross-midnight schedule (e.g., 18:00-02:00): open if past opening time today
      if (currentTime >= todaySchedule.open) {
        return { isClosed: false };
      }
    } else if (currentTime >= todaySchedule.open && currentTime < todaySchedule.close) {
      return { isClosed: false };
    }
  }

  // Check if in yesterday's cross-midnight window (e.g., 01:00 and yesterday opened 18:00-02:00)
  const yesterdayIndex = (now.getDay() + 6) % 7;
  const yesterdayDay = DAY_ORDER[yesterdayIndex]!;
  const yesterdaySchedule = hours[yesterdayDay];
  if (yesterdaySchedule && yesterdaySchedule.close < yesterdaySchedule.open && currentTime < yesterdaySchedule.close) {
    return { isClosed: false };
  }

  // Business is closed — find next opening
  const dayIndex = now.getDay();
  for (let offset = 0; offset <= 7; offset++) {
    const checkDayIndex = (dayIndex + offset) % 7;
    const checkDay = DAY_ORDER[checkDayIndex]!;
    const schedule = hours[checkDay];

    if (schedule) {
      if (offset > 0 || currentTime < schedule.open) {
        return {
          isClosed: true,
          nextOpenTime: schedule.open,
          nextOpenDay: KHMER_DAY_NAMES[checkDay] ?? checkDay,
        };
      }
    }
  }

  return { isClosed: true };
}

async function handleHoursQuery(tenantId: string): Promise<BotResponse> {
  const hours = await getBusinessHours(tenantId);
  if (!hours) {
    return {
      responseText: formatNoDataResponse("hours"),
      confidence: "low",
      intent: "hours_query",
    };
  }

  const closedInfo = getClosedInfo(hours);
  if (closedInfo.isClosed && closedInfo.nextOpenTime && closedInfo.nextOpenDay) {
    return {
      responseText: getClosedNowResponse(closedInfo.nextOpenTime, closedInfo.nextOpenDay),
      confidence: "high",
      intent: "hours_query",
    };
  }

  return {
    responseText: formatHoursResponse(hours),
    confidence: "high",
    intent: "hours_query",
  };
}

async function handleLocationQuery(tenantId: string): Promise<BotResponse> {
  const address = await getBusinessAddress(tenantId);
  if (!address) {
    return {
      responseText: formatNoDataResponse("address"),
      confidence: "low",
      intent: "location_query",
    };
  }
  return {
    responseText: formatAddressResponse(address),
    confidence: "high",
    intent: "location_query",
  };
}

async function handlePhoneQuery(tenantId: string): Promise<BotResponse> {
  const phone = await getBusinessPhone(tenantId);
  if (!phone) {
    return {
      responseText: formatNoDataResponse("phone"),
      confidence: "low",
      intent: "phone_query",
    };
  }
  return {
    responseText: formatPhoneResponse(phone),
    confidence: "high",
    intent: "phone_query",
  };
}
