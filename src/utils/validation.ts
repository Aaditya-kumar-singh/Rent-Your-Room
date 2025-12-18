import Joi from "joi";

// Custom validation error class
export class ValidationError extends Error {
  public field?: string;
  public details?: string;

  constructor(message: string, field?: string, details?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.details = details;
  }
}

// Generic validation function
export const validateInput = <T>(
  schema: Joi.ObjectSchema,
  data: unknown
): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const firstError = error.details[0];
    throw new ValidationError(
      firstError.message,
      firstError.path.join("."),
      error.details.map((d) => d.message).join(", ")
    );
  }

  return value as T;
};

// Room validation schemas
export const roomCreateSchema = Joi.object({
  title: Joi.string().min(10).max(200).required().messages({
    "string.min": "Title must be at least 10 characters long",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().min(50).max(2000).required().messages({
    "string.min": "Description must be at least 50 characters long",
    "string.max": "Description cannot exceed 2000 characters",
    "any.required": "Description is required",
  }),
  monthlyRent: Joi.number().positive().max(1000000).required().messages({
    "number.positive": "Monthly rent must be a positive number",
    "number.max": "Monthly rent cannot exceed ₹10,00,000",
    "any.required": "Monthly rent is required",
  }),
  roomType: Joi.string()
    .valid(
      "single",
      "double",
      "shared",
      "studio",
      "1bhk",
      "2bhk",
      "3bhk",
      "pg",
      "hostel"
    )
    .required()
    .messages({
      "any.only": "Invalid room type",
      "any.required": "Room type is required",
    }),
  location: Joi.object({
    address: Joi.string().min(10).max(500).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.pattern.base": "Pincode must be a 6-digit number",
      }),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).unknown(true).required(),
  }).required(),
  amenities: Joi.array()
    .items(Joi.string().max(50))
    .min(1)
    .max(20)
    .required()
    .messages({
      "array.min": "At least one amenity is required",
      "array.max": "Cannot have more than 20 amenities",
    }),
  images: Joi.array()
    .items(Joi.string().min(1))
    .min(1)
    .max(10)
    .required()
    .messages({
      "array.min": "At least one image is required",
      "array.max": "Cannot have more than 10 images",
    }),
  availability: Joi.boolean().default(true),
});

export const roomUpdateSchema = roomCreateSchema.fork(
  [
    "title",
    "description",
    "monthlyRent",
    "roomType",
    "location",
    "amenities",
    "images",
  ],
  (schema) => schema.optional()
);

// User validation schemas
export const userSignupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),
  userType: Joi.string()
    .valid("owner", "seeker", "both")
    .default("seeker")
    .messages({
      "any.only": "Invalid user type",
    }),
  profileImage: Joi.string().uri().optional(),
});

export const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  userType: Joi.string().valid("owner", "seeker", "both").optional(),
  profileImage: Joi.string().uri().optional(),
  phone: Joi.string()
    .pattern(/^\+91\d{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be in format +91XXXXXXXXXX",
    }),
});

// Search validation schema
export const roomSearchSchema = Joi.object({
  searchText: Joi.string().max(200).optional(),
  minRent: Joi.number().positive().max(1000000).optional(),
  maxRent: Joi.number().positive().max(1000000).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  roomType: Joi.string()
    .valid(
      "single",
      "double",
      "shared",
      "studio",
      "1bhk",
      "2bhk",
      "3bhk",
      "pg",
      "hostel"
    )
    .optional(),
  amenities: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().positive().max(100).optional().default(10),
  }).optional(),
  page: Joi.number().positive().max(1000).default(1),
  limit: Joi.number().positive().max(100).default(10),
  sortBy: Joi.string()
    .valid("createdAt", "monthlyRent", "title")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  includeSampleData: Joi.boolean().default(false),
})
  .custom((value, helpers) => {
    // Custom validation: maxRent should be greater than minRent
    if (value.minRent && value.maxRent && value.minRent >= value.maxRent) {
      return helpers.error("custom.rentRange");
    }
    return value;
  })
  .messages({
    "custom.rentRange": "Maximum rent must be greater than minimum rent",
  });

// Phone verification schema
export const phoneVerificationSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+91\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be in format +91XXXXXXXXXX",
      "any.required": "Phone number is required",
    }),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "OTP must be a 6-digit number",
    }),
});

// File upload validation
export const fileUploadSchema = Joi.object({
  type: Joi.string().valid("profile", "room", "document").required(),
  file: Joi.object({
    size: Joi.number()
      .max(5 * 1024 * 1024)
      .required()
      .messages({
        "number.max": "File size cannot exceed 5MB",
      }),
    type: Joi.string()
      .pattern(/^image\//)
      .required()
      .messages({
        "string.pattern.base": "Only image files are allowed",
      }),
  }).required(),
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().positive().max(1000).default(1),
  limit: Joi.number().positive().max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.pattern.base": "Invalid ID format",
  });

// Coordinate validation helper
export const coordinateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

// Email validation helper
export const emailSchema = Joi.string().email().messages({
  "string.email": "Please provide a valid email address",
});

// Password strength validation
export const strongPasswordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  });
