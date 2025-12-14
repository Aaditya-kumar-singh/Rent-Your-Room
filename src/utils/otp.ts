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

import { emailService } from "@/lib/emailService";

/**
 * Send OTP via Email
 */
export async function sendVerificationEmail(
  email: string,
  otp: string
): Promise<boolean> {
  return emailService.sendOTP(email, otp);
}
