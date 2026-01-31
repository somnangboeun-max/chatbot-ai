/**
 * Tests for Rules-Based Intent Classification
 * Story 4.5: Rules-Based FAQ Matching Engine
 */

import { describe, it, expect } from "vitest";
import { classifyIntent, extractProductName } from "./rules";

describe("classifyIntent", () => {
  describe("price_query intent", () => {
    it("should classify Khmer price keyword 'តម្លៃ' as price_query", () => {
      const result = classifyIntent("តម្លៃ lok lak");
      expect(result.intent).toBe("price_query");
    });

    it("should classify Khmer keyword 'ប៉ុន្មាន' as price_query", () => {
      const result = classifyIntent("lok lak ប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
    });

    it("should classify English 'price' as price_query", () => {
      const result = classifyIntent("What is the price of coffee?");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'how much' as price_query", () => {
      const result = classifyIntent("how much is the coffee");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'menu' as price_query", () => {
      const result = classifyIntent("show me the menu");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'cost' as price_query", () => {
      const result = classifyIntent("What does it cost?");
      expect(result.intent).toBe("price_query");
    });

    it("should return high confidence when product name is extracted", () => {
      const result = classifyIntent("តម្លៃ lok lak ប៉ុន្មាន");
      expect(result.confidence).toBe("high");
      expect(result.extractedEntity).toBeDefined();
    });

    it("should return medium confidence for 'menu' with no product name", () => {
      const result = classifyIntent("menu");
      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("medium");
      expect(result.extractedEntity).toBeUndefined();
    });

    it("should handle mixed Khmer-English price query", () => {
      const result = classifyIntent("តម្លៃ coffee ប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
      expect(result.confidence).toBe("high");
      expect(result.extractedEntity).toContain("coffee");
    });
  });

  describe("hours_query intent", () => {
    it("should classify Khmer 'ម៉ោង' as hours_query", () => {
      const result = classifyIntent("ម៉ោង បើក បិទ");
      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify Khmer 'បើក' as hours_query", () => {
      const result = classifyIntent("បើក ពេលណា");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify English 'hours' as hours_query", () => {
      const result = classifyIntent("What are your hours?");
      expect(result.intent).toBe("hours_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify 'open' as hours_query", () => {
      const result = classifyIntent("When do you open?");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify 'close' as hours_query", () => {
      const result = classifyIntent("What time do you close?");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify 'when' as hours_query", () => {
      const result = classifyIntent("when are you available");
      expect(result.intent).toBe("hours_query");
    });
  });

  describe("location_query intent", () => {
    it("should classify Khmer 'ទីតាំង' as location_query", () => {
      const result = classifyIntent("ទីតាំង នៅឯណា");
      expect(result.intent).toBe("location_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify Khmer 'នៅឯណា' as location_query", () => {
      const result = classifyIntent("នៅឯណា");
      expect(result.intent).toBe("location_query");
    });

    it("should classify English 'address' as location_query", () => {
      const result = classifyIntent("What is your address?");
      expect(result.intent).toBe("location_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify 'where' as location_query", () => {
      const result = classifyIntent("Where are you located?");
      expect(result.intent).toBe("location_query");
    });

    it("should classify 'directions' as location_query", () => {
      const result = classifyIntent("Can I get directions?");
      expect(result.intent).toBe("location_query");
    });
  });

  describe("phone_query intent", () => {
    it("should classify Khmer 'ទូរស័ព្ទ' as phone_query", () => {
      const result = classifyIntent("ទូរស័ព្ទ លេខ");
      expect(result.intent).toBe("phone_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify English 'phone' as phone_query", () => {
      const result = classifyIntent("What is your phone number?");
      expect(result.intent).toBe("phone_query");
      expect(result.confidence).toBe("high");
    });

    it("should classify 'contact' as phone_query", () => {
      const result = classifyIntent("How do I contact you?");
      expect(result.intent).toBe("phone_query");
    });

    it("should classify 'call' as phone_query", () => {
      const result = classifyIntent("Can I call you?");
      expect(result.intent).toBe("phone_query");
    });
  });

  describe("general_faq (no match)", () => {
    it("should return general_faq with low confidence for unknown message", () => {
      const result = classifyIntent("Can you do delivery?");
      expect(result.intent).toBe("general_faq");
      expect(result.confidence).toBe("low");
    });

    it("should return general_faq for empty message", () => {
      const result = classifyIntent("");
      expect(result.intent).toBe("general_faq");
      expect(result.confidence).toBe("low");
    });

    it("should return general_faq for unrelated message", () => {
      const result = classifyIntent("I love your food!");
      expect(result.intent).toBe("general_faq");
      expect(result.confidence).toBe("low");
    });
  });

  describe("greeting (Story 4.6)", () => {
    it("should classify Khmer 'សួស្តី' as greeting", () => {
      const result = classifyIntent("សួស្តី");
      expect(result.intent).toBe("greeting");
      expect(result.confidence).toBe("high");
    });

    it("should classify English 'hello' as greeting", () => {
      const result = classifyIntent("Hello there");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'good morning' as greeting", () => {
      const result = classifyIntent("good morning");
      expect(result.intent).toBe("greeting");
    });

    it("should classify Khmer 'ជំរាបសួរ' as greeting", () => {
      const result = classifyIntent("ជំរាបសួរ");
      expect(result.intent).toBe("greeting");
    });
  });

  describe("farewell (Story 4.6)", () => {
    it("should classify Khmer 'ជំរាបលា' as farewell", () => {
      const result = classifyIntent("ជំរាបលា");
      expect(result.intent).toBe("farewell");
      expect(result.confidence).toBe("high");
    });

    it("should classify English 'goodbye' as farewell", () => {
      const result = classifyIntent("goodbye");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'thank you' as farewell", () => {
      const result = classifyIntent("thank you");
      expect(result.intent).toBe("farewell");
    });

    it("should classify Khmer 'អរគុណ' as farewell", () => {
      const result = classifyIntent("អរគុណ");
      expect(result.intent).toBe("farewell");
    });
  });

  describe("case insensitivity", () => {
    it("should match uppercase English keywords", () => {
      const result = classifyIntent("PRICE of coffee");
      expect(result.intent).toBe("price_query");
    });

    it("should match mixed case English keywords", () => {
      const result = classifyIntent("What are your Hours?");
      expect(result.intent).toBe("hours_query");
    });
  });

  describe("ambiguous messages", () => {
    it("should prioritize price_query over other intents", () => {
      // "price" and "where" both present — price has higher priority
      const result = classifyIntent("Where can I find the price?");
      expect(result.intent).toBe("price_query");
    });
  });
});

describe("extractProductName", () => {
  const priceKeywords = ["តម្លៃ", "ប៉ុន្មាន", "ថ្លៃ", "price", "cost", "how much", "menu"];

  it("should extract product name from Khmer price query", () => {
    const result = extractProductName("តម្លៃ lok lak ប៉ុន្មាន", priceKeywords);
    expect(result).toContain("lok lak");
  });

  it("should extract product name from English price query", () => {
    const result = extractProductName("price of coffee", priceKeywords);
    expect(result).toContain("coffee");
  });

  it("should return undefined when no product name remains", () => {
    const result = extractProductName("menu", priceKeywords);
    expect(result).toBeUndefined();
  });

  it("should handle multiple words as product name", () => {
    const result = extractProductName("តម្លៃ fried rice", priceKeywords);
    expect(result).toContain("fried rice");
  });

  it("should clean up extra whitespace", () => {
    const result = extractProductName("price   coffee  ", priceKeywords);
    expect(result).toBe("coffee");
  });
});
