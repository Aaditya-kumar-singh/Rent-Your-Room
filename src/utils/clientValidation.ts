// Client-side validation utilities for forms and user input
import { useState, useEffect } from "react";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Email validation
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
};

// Phone number validation (Indian format)
export const validatePhoneNumber = (phone: string): FieldValidationResult => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove any spaces, dashes, or other formatting
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  // Check for Indian mobile number format
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error:
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9",
    };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string): FieldValidationResult => {
  if (!name) {
    return { isValid: false, error: "Name is required" };
  }

  if (name.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }

  if (name.length > 50) {
    return { isValid: false, error: "Name cannot exceed 50 characters" };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  if (!nameRegex.test(name)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): FieldValidationResult => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password cannot exceed 128 characters" };
  }

  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    };
  }

  return { isValid: true };
};

// OTP validation
export const validateOTP = (otp: string): FieldValidationResult => {
  if (!otp) {
    return { isValid: false, error: "OTP is required" };
  }

  if (otp.length !== 6) {
    return { isValid: false, error: "OTP must be exactly 6 digits" };
  }

  const otpRegex = /^\d{6}$/;
  if (!otpRegex.test(otp)) {
    return { isValid: false, error: "OTP must contain only numbers" };
  }

  return { isValid: true };
};

// Room title validation
export const validateRoomTitle = (title: string): FieldValidationResult => {
  if (!title) {
    return { isValid: false, error: "Room title is required" };
  }

  if (title.length < 5) {
    return {
      isValid: false,
      error: "Room title must be at least 5 characters long",
    };
  }

  if (title.length > 100) {
    return { isValid: false, error: "Room title cannot exceed 100 characters" };
  }

  return { isValid: true };
};

// Room description validation
export const validateRoomDescription = (
  description: string
): FieldValidationResult => {
  if (!description) {
    return { isValid: false, error: "Room description is required" };
  }

  if (description.length < 20) {
    return {
      isValid: false,
      error: "Room description must be at least 20 characters long",
    };
  }

  if (description.length > 1000) {
    return {
      isValid: false,
      error: "Room description cannot exceed 1000 characters",
    };
  }

  return { isValid: true };
};

// Monthly rent validation
export const validateMonthlyRent = (
  rent: string | number
): FieldValidationResult => {
  if (!rent) {
    return { isValid: false, error: "Monthly rent is required" };
  }

  const rentNumber = typeof rent === "string" ? parseFloat(rent) : rent;

  if (isNaN(rentNumber)) {
    return { isValid: false, error: "Monthly rent must be a valid number" };
  }

  if (rentNumber <= 0) {
    return { isValid: false, error: "Monthly rent must be greater than 0" };
  }

  if (rentNumber > 1000000) {
    return { isValid: false, error: "Monthly rent cannot exceed ₹10,00,000" };
  }

  if (rentNumber < 1000) {
    return {
      isValid: true,
      warning: "Monthly rent seems unusually low. Please verify the amount.",
    };
  }

  return { isValid: true };
};

// Address validation
export const validateAddress = (address: string): FieldValidationResult => {
  if (!address) {
    return { isValid: false, error: "Address is required" };
  }

  if (address.length < 10) {
    return {
      isValid: false,
      error: "Address must be at least 10 characters long",
    };
  }

  if (address.length > 200) {
    return { isValid: false, error: "Address cannot exceed 200 characters" };
  }

  return { isValid: true };
};

// City validation
export const validateCity = (city: string): FieldValidationResult => {
  if (!city) {
    return { isValid: false, error: "City is required" };
  }

  if (city.length < 2) {
    return {
      isValid: false,
      error: "City name must be at least 2 characters long",
    };
  }

  if (city.length > 50) {
    return { isValid: false, error: "City name cannot exceed 50 characters" };
  }

  const cityRegex = /^[a-zA-Z\s\-'\.]+$/;
  if (!cityRegex.test(city)) {
    return {
      isValid: false,
      error:
        "City name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }

  return { isValid: true };
};

// Pincode validation (Indian format)
export const validatePincode = (pincode: string): FieldValidationResult => {
  if (!pincode) {
    return { isValid: false, error: "Pincode is required" };
  }

  const pincodeRegex = /^[1-9][0-9]{5}$/;
  if (!pincodeRegex.test(pincode)) {
    return {
      isValid: false,
      error: "Please enter a valid 6-digit Indian pincode",
    };
  }

  return { isValid: true };
};

// Coordinates validation
export const validateCoordinates = (
  lat: number,
  lng: number
): FieldValidationResult => {
  if (lat < -90 || lat > 90) {
    return { isValid: false, error: "Latitude must be between -90 and 90" };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: "Longitude must be between -180 and 180" };
  }

  return { isValid: true };
};

// File validation
export const validateImageFile = (file: File): FieldValidationResult => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image size cannot exceed 5MB",
    };
  }

  return { isValid: true };
};

export const validateDocumentFile = (file: File): FieldValidationResult => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Only JPEG, PNG, and PDF documents are allowed",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Document size cannot exceed 10MB",
    };
  }

  return { isValid: true };
};

// Form validation helpers
export const validateForm = (
  fields: Record<string, unknown>,
  validators: Record<string, (value: unknown) => FieldValidationResult>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  Object.entries(validators).forEach(([fieldName, validator]) => {
    const result = validator(fields[fieldName]);
    if (!result.isValid && result.error) {
      errors.push(`${fieldName}: ${result.error}`);
    }
    if (result.warning) {
      warnings.push(`${fieldName}: ${result.warning}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// Real-time validation hook for React components
export const useFieldValidation = (
  value: unknown,
  validator: (value: unknown) => FieldValidationResult,
  debounceMs: number = 300
) => {
  const [result, setResult] = useState<FieldValidationResult>({
    isValid: true,
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const validationResult = validator(value);
      setResult(validationResult);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validator, debounceMs]);

  return { ...result, isValidating };
};

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^[1-9][0-9]{5}$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
  otp: /^\d{6}$/,
  password: {
    minLength: 8,
    maxLength: 128,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /\d/,
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, " ");
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, "");
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = sanitizePhoneNumber(phone);
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};
