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
      responseText: formatNoMatchResponse(),
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

async function handleHoursQuery(tenantId: string): Promise<BotResponse> {
  const hours = await getBusinessHours(tenantId);
  if (!hours) {
    return {
      responseText: formatNoDataResponse("hours"),
      confidence: "low",
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
