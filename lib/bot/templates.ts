/**
 * Bot Response Templates
 * Story 4.3: Send Automated Responses via Messenger
 *
 * Khmer-first response templates for automated bot responses.
 * Story 4.5 will implement FAQ matching for intelligent responses.
 */

/**
 * Default acknowledgment response for MVP.
 * Used when no specific FAQ match is found.
 *
 * Translation: "Hello! Thank you for your message. We are reviewing your question."
 */
export function getDefaultResponse(): string {
  return "សួស្តី! សូមអរគុណសម្រាប់សារ។ យើងកំពុងពិនិត្យមើលសំណួររបស់អ្នក។";
}

/**
 * Response when bot cannot answer confidently.
 * Used by Story 4.9 (confidence scoring).
 *
 * Translation: "Please wait a moment, I will notify staff."
 */
export function getHandoverResponse(): string {
  return "សូមរង់ចាំបន្តិច ខ្ញុំនឹងជូនដំណឹងដល់បុគ្គលិក។";
}

/**
 * Response when business hours information is unavailable.
 *
 * Translation: "Please contact us directly for business hours information."
 */
export function getBusinessHoursUnknownResponse(): string {
  return "សូមទាក់ទងមកយើងដោយផ្ទាល់សម្រាប់ព័ត៌មានម៉ោងធ្វើការ។";
}
