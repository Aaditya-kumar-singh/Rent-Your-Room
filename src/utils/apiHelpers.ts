import { NextRequest } from "next/server";
import { RoomSearchFilters, PaginationOptions } from "@/services/roomService";

/**
 * Parse search filters from URL search parameters
 */
export const parseSearchFilters = (
  searchParams: URLSearchParams
): RoomSearchFilters => {
  const filters: RoomSearchFilters = {};

  // Price range filters
  const minRent = searchParams.get("minRent");
  const maxRent = searchParams.get("maxRent");
  if (minRent && !isNaN(Number(minRent))) filters.minRent = parseInt(minRent);
  if (maxRent && !isNaN(Number(maxRent))) filters.maxRent = parseInt(maxRent);

  // Location filters
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  if (city) filters.city = city;
  if (state) filters.state = state;

  // Room type filter
  const roomType = searchParams.get("roomType");
  if (roomType) filters.roomType = roomType;

  // Amenities filter
  const amenitiesParam = searchParams.get("amenities");
  if (amenitiesParam) {
    filters.amenities = amenitiesParam
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  // Availability filter
  const availability = searchParams.get("availability");
  if (availability !== null) {
    filters.availability = availability === "true";
  }

  // Text search
  const searchText = searchParams.get("search");
  if (searchText) filters.searchText = searchText;

  // Sample data inclusion
  const includeSampleData = searchParams.get("includeSampleData");
  if (includeSampleData)
    filters.includeSampleData = includeSampleData === "true";

  // Geospatial search
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    filters.coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius && !isNaN(Number(radius)) ? parseFloat(radius) : 10,
    };
  }

  return filters;
};

/**
 * Parse pagination options from URL search parameters
 */
export const parsePaginationOptions = (
  searchParams: URLSearchParams
): PaginationOptions => {
  const options: PaginationOptions = {};

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  if (page && !isNaN(Number(page))) options.page = parseInt(page);
  if (limit && !isNaN(Number(limit))) options.limit = parseInt(limit);
  if (sortBy) options.sortBy = sortBy;
  if (sortOrder && (sortOrder === "asc" || sortOrder === "desc")) {
    options.sortOrder = sortOrder;
  }

  return options;
};

/**
 * Validate coordinate parameters
 */
export const validateCoordinates = (
  lat: number,
  lng: number
): { isValid: boolean; error?: string } => {
  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: "Invalid latitude or longitude values" };
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: "Latitude must be between -90 and 90" };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: "Longitude must be between -180 and 180" };
  }

  return { isValid: true };
};

/**
 * Validate numeric parameters
 */
export const validateNumericParam = (
  value: number | undefined,
  paramName: string,
  min: number = 0
): { isValid: boolean; error?: string } => {
  if (value !== undefined && (isNaN(value) || value < min)) {
    return {
      isValid: false,
      error: `${paramName} must be a valid number greater than or equal to ${min}`,
    };
  }
  return { isValid: true };
};
