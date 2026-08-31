import { env } from "../config/env.js";

/**
 * Validates whether TextBee SMS gateway is configured
 */
export function isTextbeeConfigured() {
  return Boolean(env.textbeeApiKey && env.textbeeDeviceId);
}

/**
 * Format phone number to E.164 international format
 * @param {string|number} number 
 * @returns {string} Formatted number with '+' prefix
 */
export function formatPhoneNumber(number) {
  if (!number) return "";
  let cleaned = String(number).trim().replace(/[^\d+]/g, "");

  // If 10-digit standard mobile number without country code
  if (/^\d{10}$/.test(cleaned)) {
    const code = env.defaultCountryCode || "+91";
    cleaned = `${code.startsWith("+") ? code : "+" + code}${cleaned}`;
  } else if (/^0\d{10}$/.test(cleaned)) {
    const code = env.defaultCountryCode || "+91";
    cleaned = `${code.startsWith("+") ? code : "+" + code}${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Send SMS message using textbee.dev gateway
 * @param {string|string[]} to - Recipient phone number or array of phone numbers
 * @param {string} message - Text content of the SMS
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, responseData?: any}>}
 */
export async function sendSMS(to, message) {
  if (!isTextbeeConfigured()) {
    const errorMsg = "TextBee credentials (TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID) not configured in backend .env";
    console.warn(`⚠️ [TextBee SMS Skipped] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const recipientList = (Array.isArray(to) ? to : [to])
      .map((num) => formatPhoneNumber(num))
      .filter(Boolean);

    if (recipientList.length === 0) {
      return { success: false, error: "No valid recipient phone number provided" };
    }

    const baseUrl = (env.textbeeBaseUrl || "https://api.textbee.dev/api/v1").replace(/\/+$/, "");
    // TextBee supports POST /gateway/devices/{deviceId}/sendSMS or /gateway/send-sms
    const endpoint = `${baseUrl}/gateway/devices/${env.textbeeDeviceId}/sendSMS`;

    console.log(`📨 [TextBee SMS] Sending to ${recipientList.join(", ")} via device ${env.textbeeDeviceId}...`);

    const payload = {
      recipients: recipientList,
      message: message,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.textbeeApiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = responseData?.message || responseData?.error || `HTTP ${response.status} ${response.statusText}`;
      console.error(`❌ [TextBee SMS Error] Failed with status ${response.status}: ${errMsg}`);
      return { success: false, error: errMsg, responseData };
    }

    const messageId =
      responseData?.id ||
      responseData?.messageId ||
      responseData?.data?.id ||
      responseData?.data?._id ||
      (Array.isArray(responseData?.data?.sms) && responseData.data.sms[0]?.id) ||
      "textbee_" + Date.now();

    console.log(`✅ [TextBee SMS Sent] Successfully dispatched. ID: ${messageId}`);
    return { success: true, messageId: String(messageId), responseData };
  } catch (error) {
    const errMsg = error.message || "Failed to send SMS via TextBee";
    console.error(`❌ [TextBee SMS Error] ${errMsg}`);
    return { success: false, error: errMsg };
  }
}
