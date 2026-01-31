/**
 * Tests for Rules-Based Intent Classification
 * Story 4.5: Rules-Based FAQ Matching Engine
 */

import { describe, it, expect } from "vitest";
import { classifyIntent, extractProductName, normalizeMessage } from "./rules";

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
      const result = classifyIntent("What is your specialty?");
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

  describe("expanded mixed Khmer-English keywords (Story 4.7)", () => {
    // Task 1.2: price_query expanded keywords
    it("should classify 'delivery fee' as price_query", () => {
      const result = classifyIntent("delivery fee ប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'discount' as price_query", () => {
      const result = classifyIntent("មាន discount ទេ");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'promotion' as price_query", () => {
      const result = classifyIntent("មាន promotion ទេ");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'promo' as price_query", () => {
      const result = classifyIntent("promo ថ្ងៃនេះ");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'sale' as price_query", () => {
      const result = classifyIntent("មាន sale ទេ");
      expect(result.intent).toBe("price_query");
    });

    it("should classify Khmer 'ការដឹកជញ្ជូន' as price_query", () => {
      const result = classifyIntent("ការដឹកជញ្ជូន ប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
    });

    it("should classify Khmer 'បញ្ចុះតម្លៃ' as price_query", () => {
      const result = classifyIntent("មាន បញ្ចុះតម្លៃ ទេ");
      expect(result.intent).toBe("price_query");
    });

    it("should classify Khmer 'ថែម' as price_query", () => {
      const result = classifyIntent("ថែម អ្វី");
      expect(result.intent).toBe("price_query");
    });

    // Task 1.2: hours_query expanded keywords
    it("should classify Khmer 'ម៉ោងបើក' as hours_query", () => {
      const result = classifyIntent("ម៉ោងបើក ពេលណា");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify Khmer 'ម៉ោងបិទ' as hours_query", () => {
      const result = classifyIntent("ម៉ោងបិទ ពេលណា");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify 'schedule' as hours_query", () => {
      const result = classifyIntent("What is your schedule?");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify 'available' as hours_query", () => {
      const result = classifyIntent("When are you available?");
      expect(result.intent).toBe("hours_query");
    });

    // Task 1.2: location_query expanded keywords
    it("should classify 'shop' as location_query", () => {
      const result = classifyIntent("shop នៅឯណា");
      expect(result.intent).toBe("location_query");
    });

    it("should classify 'store' as location_query", () => {
      const result = classifyIntent("store នៅឯណា");
      expect(result.intent).toBe("location_query");
    });

    it("should classify Khmer 'ហាង' as location_query", () => {
      const result = classifyIntent("ហាង នៅឯណា");
      expect(result.intent).toBe("location_query");
    });

    it("should classify 'map' as location_query", () => {
      const result = classifyIntent("send me map");
      expect(result.intent).toBe("location_query");
    });

    it("should classify Khmer 'ជិត' as location_query", () => {
      const result = classifyIntent("ជិត ផ្សារ ទេ");
      expect(result.intent).toBe("location_query");
    });

    it("should classify Khmer 'ផ្លូវ' as location_query", () => {
      const result = classifyIntent("ផ្លូវ អ្វី");
      expect(result.intent).toBe("location_query");
    });

    // Task 1.2: phone_query expanded keywords
    it("should classify 'telegram' as phone_query", () => {
      const result = classifyIntent("telegram លេខ");
      expect(result.intent).toBe("phone_query");
    });

    it("should classify 'line' as phone_query", () => {
      const result = classifyIntent("line id អ្វី");
      expect(result.intent).toBe("phone_query");
    });

    it("should classify 'message' as phone_query", () => {
      const result = classifyIntent("message ទៅលេខណា");
      expect(result.intent).toBe("phone_query");
    });

    it("should classify Khmer 'ទំនាក់' as phone_query", () => {
      const result = classifyIntent("ទំនាក់ បង");
      expect(result.intent).toBe("phone_query");
    });

    // Task 1.3: Compound Khmer-English phrases
    it("should classify 'តម្លៃ delivery' as price_query", () => {
      const result = classifyIntent("តម្លៃ delivery ប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'ម៉ោងopen' as hours_query", () => {
      const result = classifyIntent("ម៉ោង open ម៉ោង close");
      expect(result.intent).toBe("hours_query");
    });
  });

  describe("commerce synonyms (Story 4.7 Task 4)", () => {
    it("should classify 'delivery' alone as price_query via synonyms", () => {
      const result = classifyIntent("Can you do delivery?");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'deliver' as price_query via synonyms", () => {
      const result = classifyIntent("Do you deliver?");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'order' as general_faq (no synonym — falls through)", () => {
      const result = classifyIntent("I want to order");
      expect(result.intent).toBe("general_faq");
    });

    it("should classify 'booking' as general_faq (no synonym — falls through)", () => {
      const result = classifyIntent("Can I make a booking?");
      expect(result.intent).toBe("general_faq");
    });

    it("should classify 'wifi' as location_query via synonyms", () => {
      const result = classifyIntent("Do you have wifi?");
      expect(result.intent).toBe("location_query");
    });

    it("should classify 'parking' as location_query via synonyms", () => {
      const result = classifyIntent("Is there parking?");
      expect(result.intent).toBe("location_query");
    });

    it("should NOT let synonym override primary keyword match", () => {
      // "price" is a primary keyword for price_query; "wifi" is a synonym for location
      // price_query has higher priority, so it should win
      const result = classifyIntent("What is the price of wifi?");
      expect(result.intent).toBe("price_query");
    });
  });

  describe("expanded greeting keywords (Story 4.8 Task 1)", () => {
    it("should classify 'hi' as greeting via synonym", () => {
      const result = classifyIntent("hi");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'hey' as greeting via synonym", () => {
      const result = classifyIntent("hey");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'hi បង' as greeting", () => {
      const result = classifyIntent("hi បង");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'សុខសប្បាយ' as greeting", () => {
      const result = classifyIntent("សុខសប្បាយ");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'ឡូ' as greeting", () => {
      const result = classifyIntent("ឡូ");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'halo' as greeting", () => {
      const result = classifyIntent("halo");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'hello បង' as greeting", () => {
      const result = classifyIntent("hello បង");
      expect(result.intent).toBe("greeting");
    });
  });

  describe("expanded farewell keywords (Story 4.8 Task 2)", () => {
    it("should classify 'អរគុណច្រើន' as farewell", () => {
      const result = classifyIntent("អរគុណច្រើន");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'ok' as farewell via synonym (standalone)", () => {
      const result = classifyIntent("ok");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'okay' as farewell via synonym", () => {
      const result = classifyIntent("okay");
      expect(result.intent).toBe("farewell");
      expect(result.confidence).toBe("medium");
    });

    it("should classify 'ចាស' as farewell", () => {
      const result = classifyIntent("ចាស");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'បាទ' as farewell", () => {
      const result = classifyIntent("បាទ");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'ok thanks' as farewell", () => {
      const result = classifyIntent("ok thanks");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'អរគុណណា' as farewell", () => {
      const result = classifyIntent("អរគុណណា");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'អរគុណហើយ' as farewell", () => {
      const result = classifyIntent("អរគុណហើយ");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'ល្អ' as farewell", () => {
      const result = classifyIntent("ល្អ");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'thank' as farewell", () => {
      const result = classifyIntent("thank");
      expect(result.intent).toBe("farewell");
    });
  });

  describe("greeting/farewell priority and false-positive prevention (Story 4.8)", () => {
    it("should classify 'សួស្តី តម្លៃប៉ុន្មាន?' as price_query (NOT greeting)", () => {
      const result = classifyIntent("សួស្តី តម្លៃប៉ុន្មាន?");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'hi តម្លៃ lok lak' as price_query (NOT greeting)", () => {
      const result = classifyIntent("hi តម្លៃ lok lak");
      expect(result.intent).toBe("price_query");
    });

    it("should classify 'ok' with hours keyword as hours_query (NOT farewell)", () => {
      // hours keyword has higher priority than farewell
      const result = classifyIntent("ok \u1798\u17C9\u17C4\u1784\u1794\u17BE\u1780\u1798\u17C9\u17C4\u1784\u1794\u17B7\u1791");
      expect(result.intent).toBe("hours_query");
    });

    it("should classify message with both farewell keywords as farewell", () => {
      const result = classifyIntent("\u17A2\u179A\u1782\u17BB\u178E bye");
      expect(result.intent).toBe("farewell");
    });

    it("should still classify pure Khmer greeting as greeting (regression)", () => {
      const result = classifyIntent("\u179F\u17BD\u179F\u17D2\u178F\u17B8");
      expect(result.intent).toBe("greeting");
    });

    it("should still classify pure Khmer farewell as farewell (regression)", () => {
      const result = classifyIntent("\u17A2\u179A\u1782\u17BB\u178E");
      expect(result.intent).toBe("farewell");
    });

    it("should NOT false-positive 'booking' as farewell (ok is word-level only)", () => {
      const result = classifyIntent("Can I make a booking?");
      expect(result.intent).toBe("general_faq");
    });

    it("should NOT false-positive 'this' as greeting (hi is word-level only)", () => {
      const result = classifyIntent("Can I get this?");
      expect(result.intent).toBe("general_faq");
    });

    it("should NOT false-positive 'okayed' as farewell (okay is word-level only)", () => {
      const result = classifyIntent("The request was okayed");
      expect(result.intent).toBe("general_faq");
    });
  });

  describe("greeting/farewell commerce synonyms (Story 4.8 Task 3)", () => {
    it("should classify 'sup' as greeting via synonym", () => {
      const result = classifyIntent("sup");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'yo' as greeting via synonym", () => {
      const result = classifyIntent("yo");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'howdy' as greeting via synonym", () => {
      const result = classifyIntent("howdy");
      expect(result.intent).toBe("greeting");
    });

    it("should classify 'thx' as farewell via synonym", () => {
      const result = classifyIntent("thx");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'ty' as farewell via synonym", () => {
      const result = classifyIntent("ty");
      expect(result.intent).toBe("farewell");
    });

    it("should classify 'cheers' as farewell via synonym", () => {
      const result = classifyIntent("cheers");
      expect(result.intent).toBe("farewell");
    });
  });

  describe("Story 4.7 comprehensive mixed-language scenarios (Task 5.1)", () => {
    it("should classify mixed 'តម org លorg delivery fee ប org ន org មorg ន?' as price_query", () => {
      const result = classifyIntent("តម org លorg  delivery fee ប org ន org មorg ន?");
      expect(result.intent).toBe("price_query");
    });

    it("should classify lok lak + Khmer price keywords with extracted product", () => {
      const result = classifyIntent("lok lak តម្លៃប៉ុន្មាន");
      expect(result.intent).toBe("price_query");
      expect(result.extractedEntity).toContain("lok lak");
    });

    it("should classify 'តើ order ទorg នorg ញorg នorg ទorg ' as general_faq (order not implemented)", () => {
      const result = classifyIntent("I want to order food");
      expect(result.intent).toBe("general_faq");
    });

    it("should still classify pure Khmer 'តម្លៃប៉ុន្មាន?' as price_query", () => {
      const result = classifyIntent("តម្លៃប៉ុន្មាន?");
      expect(result.intent).toBe("price_query");
    });

    it("should still classify pure English 'what is the price?' as price_query", () => {
      const result = classifyIntent("what is the price?");
      expect(result.intent).toBe("price_query");
    });
  });
});

describe("normalizeMessage (Story 4.7)", () => {
  it("should lowercase Latin characters only", () => {
    const result = normalizeMessage("HELLO តម្លៃ");
    expect(result).toBe("hello តម្លៃ");
  });

  it("should preserve Khmer script unchanged", () => {
    const result = normalizeMessage("តម្លៃ ប៉ុន្មាន");
    expect(result).toContain("តម្លៃ");
    expect(result).toContain("ប៉ុន្មាន");
  });

  it("should remove zero-width space (U+200B)", () => {
    const result = normalizeMessage("តម្លៃ\u200Bប៉ុន្មាន");
    expect(result).toBe("តម្លៃប៉ុន្មាន");
  });

  it("should remove zero-width non-joiner (U+200C)", () => {
    const result = normalizeMessage("តម្លៃ\u200Ctest");
    expect(result).toBe("តម្លៃtest");
  });

  it("should normalize non-breaking space to regular space", () => {
    const result = normalizeMessage("hello\u00A0world");
    expect(result).toBe("hello world");
  });

  it("should trim excess whitespace between segments", () => {
    const result = normalizeMessage("តម្លៃ   delivery   ប៉ុន្មាន");
    expect(result).toBe("តម្លៃ delivery ប៉ុន្មាន");
  });

  it("should handle combined zero-width characters and whitespace", () => {
    const result = normalizeMessage("តម្លៃ\u200B \u200C delivery\u00A0fee");
    expect(result).toBe("តម្លៃ delivery fee");
  });

  it("should trim leading and trailing whitespace", () => {
    const result = normalizeMessage("  hello  ");
    expect(result).toBe("hello");
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

  // Story 4.7 Task 3: Mixed-language product extraction
  it("should extract product from 'តម្លៃ lok lak ប៉ុន្មាន?'", () => {
    const result = extractProductName("តម្លៃ lok lak ប៉ុន្មាន?", priceKeywords);
    expect(result).toBe("lok lak");
  });

  it("should extract product from 'lok lak តម្លៃប៉ុន្មាន'", () => {
    const result = extractProductName("lok lak តម្លៃប៉ុន្មាន", priceKeywords);
    expect(result).toBe("lok lak");
  });

  it("should extract product from 'បង lok lak price ប៉ុន្មាន'", () => {
    const result = extractProductName("បង lok lak price ប៉ុន្មាន", priceKeywords);
    expect(result).toBe("lok lak");
  });

  it("should remove Khmer filler word 'អី'", () => {
    const result = extractProductName("បងអី lok lak តម្លៃ", priceKeywords);
    expect(result).toBe("lok lak");
  });

  it("should remove Khmer filler word 'នេះ'", () => {
    const result = extractProductName("នេះ តម្លៃ coffee", priceKeywords);
    expect(result).toBe("coffee");
  });

  it("should remove Khmer filler word 'នោះ'", () => {
    const result = extractProductName("នោះ តម្លៃ tea", priceKeywords);
    expect(result).toBe("tea");
  });

  it("should remove Khmer filler word 'មួយ'", () => {
    const result = extractProductName("lok lak មួយ ប៉ុន្មាន", priceKeywords);
    expect(result).toBe("lok lak");
  });
});
