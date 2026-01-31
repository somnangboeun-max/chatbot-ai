/**
 * Bot Response Templates
 * Story 4.3 + 4.5: Khmer-first response templates
 *
 * All templates use proper Khmer politeness markers (សូម, អភ័យទោស).
 * Variable substitution for product names, prices, hours, addresses.
 */

import type { Product, BusinessInfo } from "./types";

// ── Existing templates (Story 4.3) ──────────────────────────────

/**
 * Default acknowledgment response.
 * Translation: "Hello! Thank you for your message. We are reviewing your question."
 */
export function getDefaultResponse(): string {
  return "សួស្តី! សូមអរគុណសម្រាប់សារ។ យើងកំពុងពិនិត្យមើលសំណួររបស់អ្នក។";
}

/**
 * Response when bot cannot answer confidently.
 * Translation: "Please wait a moment, I will notify staff."
 */
export function getHandoverResponse(): string {
  return "សូមរង់ចាំបន្តិច ខ្ញុំនឹងជូនដំណឹងដល់បុគ្គលិក។";
}

/**
 * Response when business hours information is unavailable.
 * Translation: "Please contact us directly for business hours information."
 */
export function getBusinessHoursUnknownResponse(): string {
  return "សូមទាក់ទងមកយើងដោយផ្ទាល់សម្រាប់ព័ត៌មានម៉ោងធ្វើការ។";
}

// ── FAQ Response Templates (Story 4.5) ──────────────────────────

/**
 * Single product price response.
 * Translation: "Hello! The price of {name} is {formattedPrice}. Thank you for asking!"
 */
export function formatPriceResponse(
  name: string,
  price: number,
  currency: string
): string {
  const formattedPrice = formatCurrency(price, currency);
  return `សួស្តី! ${name} មានតម្លៃ ${formattedPrice}។ សូមអរគុណសម្រាប់ការសាកសួរ!`;
}

/**
 * Product list response (menu).
 * Translation: "Hello! Here are our products:\n{list}\nPlease ask about any product for details!"
 */
export function formatProductListResponse(products: Product[]): string {
  const productLines = products
    .map((p) => `• ${p.name} - ${formatCurrency(p.price, p.currency)}`)
    .join("\n");
  return `សួស្តី! នេះគឺជាផលិតផលរបស់យើង:\n${productLines}\nសូមសាកសួរអំពីផលិតផលណាមួយសម្រាប់ព័ត៌មានលម្អិត!`;
}

/**
 * Product not found response with available products list.
 * Translation: "Sorry, we could not find '{query}'. Here are our available products:\n{list}"
 */
export function formatProductNotFoundResponse(
  query: string,
  availableProducts: Product[]
): string {
  const productLines = availableProducts
    .map((p) => `• ${p.name} - ${formatCurrency(p.price, p.currency)}`)
    .join("\n");
  return `អភ័យទោស យើងរកមិនឃើញ "${query}"។ នេះគឺជាផលិតផលដែលមាន:\n${productLines}\nសូមសាកសួរអំពីផលិតផលណាមួយខាងលើ!`;
}

/**
 * Business hours response.
 * Translation: "Hello! Here are our business hours:\n{schedule}\nThank you for asking!"
 */
export function formatHoursResponse(
  hours: NonNullable<BusinessInfo["opening_hours"]>
): string {
  const dayNames: Record<string, string> = {
    monday: "ច័ន្ទ",
    tuesday: "អង្គារ",
    wednesday: "ពុធ",
    thursday: "ព្រហស្បតិ៍",
    friday: "សុក្រ",
    saturday: "សៅរ៍",
    sunday: "អាទិត្យ",
  };

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const scheduleLines = dayOrder
    .filter((day) => hours[day])
    .map((day) => {
      const schedule = hours[day]!;
      const khmerDay = dayNames[day] ?? day;
      return `• ${khmerDay}: ${schedule.open} - ${schedule.close}`;
    });

  if (scheduleLines.length === 0) {
    return getBusinessHoursUnknownResponse();
  }

  return `សួស្តី! នេះគឺជាម៉ោងធ្វើការរបស់យើង:\n${scheduleLines.join("\n")}\nសូមអរគុណសម្រាប់ការសាកសួរ!`;
}

/**
 * Business address response.
 * Translation: "Hello! Our location is: {address}. Thank you for asking!"
 */
export function formatAddressResponse(address: string): string {
  return `សួស្តី! ទីតាំងរបស់យើងគឺ: ${address}។ សូមអរគុណសម្រាប់ការសាកសួរ!`;
}

/**
 * Business phone response.
 * Translation: "Hello! You can contact us at: {phone}. Thank you for asking!"
 */
export function formatPhoneResponse(phone: string): string {
  return `សួស្តី! អ្នកអាចទាក់ទងមកយើងតាមលេខ: ${phone}។ សូមអរគុណសម្រាប់ការសាកសួរ!`;
}

/**
 * No match / low confidence response.
 * Translation: "Please wait a moment, I will notify staff to assist you."
 */
export function formatNoMatchResponse(): string {
  return getHandoverResponse();
}

/**
 * No data available response for a specific category.
 * Translation varies by category.
 */
export function formatNoDataResponse(
  category: "products" | "hours" | "address" | "phone"
): string {
  switch (category) {
    case "products":
      return "អភ័យទោស យើងមិនមានព័ត៌មានផលិតផលនៅពេលនេះទេ។ សូមទាក់ទងមកយើងដោយផ្ទាល់។";
    case "hours":
      return getBusinessHoursUnknownResponse();
    case "address":
      return "អភ័យទោស យើងមិនមានព័ត៌មានទីតាំងនៅពេលនេះទេ។ សូមទាក់ទងមកយើងដោយផ្ទាល់។";
    case "phone":
      return "អភ័យទោស យើងមិនមានព័ត៌មានទំនាក់ទំនងនៅពេលនេះទេ។ សូមទាក់ទងមកយើងដោយផ្ទាល់។";
  }
}

// ── Greeting Templates (Story 4.6) ───────────────────────────────

/**
 * Greeting response variants for natural variety.
 * Returns contextually appropriate greeting based on available info.
 */
const GREETING_VARIANTS = [
  /** Formal greeting with business name.
   * Translation: "Hello! Welcome to {businessName}. How can we help you today?" */
  (businessName: string) =>
    `សួស្តី! សូមស្វាគមន៍មក ${businessName}។ តើយើងអាចជួយអ្នកដោយរបៀបណា?`,

  /** Time-aware greeting (morning/afternoon/evening).
   * Translation: "Good {timeOfDay}! Welcome. Please feel free to ask any question." */
  () => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12
        ? "អរុណសួស្តី"
        : hour < 18
          ? "ទិវាសួស្តី"
          : "សាយ័ណ្ហសួស្តី";
    return `${timeGreeting}! សូមស្វាគមន៍។ សូមសាកសួរអ្វីដែលអ្នកចង់ដឹង។`;
  },

  /** Generic welcoming greeting.
   * Translation: "Hello! Thank you for contacting us. How can we assist you?" */
  () =>
    "សួស្តី! សូមអរគុណដែលបានទាក់ទងមកយើង។ តើយើងអាចជួយអ្វីបានខ្លះ?",
] as const;

/**
 * Get a contextually appropriate greeting response.
 * Uses business name if provided, otherwise rotates variants.
 *
 * @param businessName - Optional business name for personalized greeting
 */
export function getGreetingResponse(businessName?: string): string {
  if (businessName) {
    return GREETING_VARIANTS[0](businessName);
  }
  // Alternate between time-aware and generic greetings
  const variantIndex = new Date().getMinutes() % 2 === 0 ? 1 : 2;
  return GREETING_VARIANTS[variantIndex]();
}

// ── Farewell Templates (Story 4.6) ──────────────────────────────

/**
 * Standard farewell with thanks.
 * Translation: "Thank you for contacting us! If you have more questions, please feel free to ask anytime. Have a wonderful day!"
 */
export function getFarewellResponse(): string {
  const variants = [
    "សូមអរគុណសម្រាប់ការទាក់ទង! ប្រសិនបើអ្នកមានសំណួរបន្ថែម សូមសាកសួរបានគ្រប់ពេល។ សូមឱ្យមានថ្ងៃល្អ!",
    "សូមអរគុណ! យើងរីករាយដែលបានជួយអ្នក។ សូមកុំស្ទាក់ស្ទើរក្នុងការទាក់ទងមកយើងម្ដងទៀត។",
  ];
  return variants[new Date().getMinutes() % 2]!;
}

// ── Business Closed Template (Story 4.6) ─────────────────────────

/**
 * Response when business is currently closed, showing next opening time.
 * Translation: "Sorry, we are currently closed. We will open again on {nextOpenDay} at {nextOpenTime}. Thank you for your patience!"
 *
 * @param nextOpenTime - Next opening time (e.g., "08:00")
 * @param nextOpenDay - Next opening day in Khmer (e.g., "ច័ន្ទ")
 */
export function getClosedNowResponse(
  nextOpenTime: string,
  nextOpenDay: string
): string {
  return `អភ័យទោស យើងបានបិទហើយនៅពេលនេះ។ យើងនឹងបើកវិញនៅថ្ងៃ${nextOpenDay} ម៉ោង ${nextOpenTime}។ សូមអរគុណសម្រាប់ការអត់ធ្មត់!`;
}

// ── Error/Fallback Templates (Story 4.6) ─────────────────────────

/**
 * Response for temporary technical errors with retry suggestion.
 * Translation: "Sorry, a temporary error occurred. Please try sending your message again. If the problem persists, please contact us directly."
 */
export function getErrorResponse(): string {
  return "អភ័យទោស មានបញ្ហាបច្ចេកទេសបណ្ដោះអាសន្ន។ សូមសាកល្បងផ្ញើសារម្ដងទៀត។ ប្រសិនបើបញ្ហានៅតែបន្ត សូមទាក់ទងមកយើងដោយផ្ទាល់។";
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Format a price with the appropriate currency symbol.
 * USD: $X.XX | KHR: X រៀល
 */
export function formatCurrency(price: number, currency: string): string {
  if (currency.toUpperCase() === "USD") {
    return `$${price.toFixed(2)}`;
  }
  if (currency.toUpperCase() === "KHR") {
    return `${price.toLocaleString()} រៀល`;
  }
  return `${price} ${currency}`;
}
