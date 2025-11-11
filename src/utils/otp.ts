import crypto from "crypto";

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Validate phone number format (Indian mobile numbers)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove any spaces, dashes, or other non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Check for Indian mobile number patterns
  const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/;

  return indianMobileRegex.test(cleanPhone);
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or other non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // If it starts with +91, keep it as is
  if (cleanPhone.startsWith("+91")) {
    return cleanPhone;
  }

  // If it starts with 91, add +
  if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
    return "+" + cleanPhone;
  }

  // If it's a 10-digit number, add +91
  if (cleanPhone.length === 10) {
    return "+91" + cleanPhone;
  }

  return cleanPhone;
}

/**
 * Send SMS using a mock service (replace with actual SMS service)
 * In production, integrate with services like Twilio, AWS SNS, or Indian SMS providers
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    // Mock SMS service - replace with actual implementation
    console.log(`SMS to ${phone}: ${message}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, implement actual SMS service:
    /*
    const response = await fetch('https://api.sms-service.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        from: 'RoomRental'
      })
    });
    
    return response.ok;
    */

    return true; // Mock success
  } catch (error) {
    console.error("SMS sending error:", error);
    return false;
  }
}

/**
 * Generate OTP message
 */
export function generateOTPMessage(otp: string): string {
  return `Your Room Rental Platform verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
}
