import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  nextTick,
  watch,
} from "vue";



// Define interfaces for props
interface RoomFormData {
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: string;
    state: string;
    pincode: string;
  };
  amenities: string[];
  roomType: string;
  images: string[];
}

export default defineComponent({
  name: "RoomListingForm",
  props: {
    initialData: {
      type: Object as () => Partial<RoomFormData>,
      default: () => ({}),
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    onSubmit: {
      type: Function as unknown as () => (data: RoomFormData) => void,
      required: true,
    },
    onCancel: {
      type: Function as unknown as () => () => void,
      required: true,
    },
  },
  setup(props) {
    // Reactive data
    const formData = reactive({
      title: props.initialData?.title || "",
      description: props.initialData?.description || "",
      monthlyRent: props.initialData?.monthlyRent || 0,
      location: {
        address: props.initialData?.location?.address || "",
        coordinates: {
          lat: props.initialData?.location?.coordinates?.lat || 0,
          lng: props.initialData?.location?.coordinates?.lng || 0,
        },
        city: props.initialData?.location?.city || "",
        state: props.initialData?.location?.state || "",
        pincode: props.initialData?.location?.pincode || "",
      },
      amenities: props.initialData?.amenities || [],
      roomType: props.initialData?.roomType || "",
      images: props.initialData?.images || [],
    });

    const errors = reactive({
      title: "",
      description: "",
      monthlyRent: "",
      roomType: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      coordinates: "",
      images: "",
    });

    const isSubmitting = ref(false);
    const imagePreview = ref<Array<{ url: string; file?: File }>>([]);
    const submitError = ref("");

    // Available amenities
    const availableAmenities = [
      "WiFi",
      "AC",
      "Parking",
      "Laundry",
      "Kitchen",
      "Balcony",
      "Furnished",
      "Security",
      "Elevator",
      "Power Backup",
      "Water Supply",
      "Gym",
      "Swimming Pool",
      "Garden",
    ];



    // Initialize form with existing data if editing
    onMounted(() => {
      if (
        props.initialData?.images &&
        Array.isArray(props.initialData.images)
      ) {
        imagePreview.value = props.initialData.images.map((url: string) => ({
          url,
        }));
      }


    });



    // Handle manual coordinate changes
    const onCoordinateChange = () => {
      const lat = formData.location.coordinates.lat;
      const lng = formData.location.coordinates.lng;

      if (lat && lng) {
        clearError("coordinates");
      }
    };

    // Handle image upload
    const handleImageUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (!files) return;

      // Validate file count
      if (imagePreview.value.length + files.length > 10) {
        setError("images", "Maximum 10 images allowed");
        return;
      }

      const validFiles: File[] = [];

      // Validate files first
      Array.from(files).forEach((file) => {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("images", "Each image must be less than 5MB");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError("images", "Only image files are allowed");
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length === 0) return;

      // Create preview for valid files
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            imagePreview.value.push({
              url: e.target.result as string,
              file: file,
            });
          }
        };
        reader.readAsDataURL(file);
      });

      clearError("images");
      // Clear the input
      target.value = "";
    };

    // Remove image
    const removeImage = (index: number) => {
      imagePreview.value.splice(index, 1);
    };

    // Validation functions
    const validateForm = (): boolean => {
      clearAllErrors();
      let isValid = true;

      // Title validation
      if (!formData.title.trim()) {
        setError("title", "Title is required");
        isValid = false;
      } else if (formData.title.length < 10) {
        setError("title", "Title must be at least 10 characters");
        isValid = false;
      }

      // Description validation
      if (!formData.description.trim()) {
        setError("description", "Description is required");
        isValid = false;
      } else if (formData.description.length < 50) {
        setError("description", "Description must be at least 50 characters");
        isValid = false;
      }

      // Monthly rent validation
      if (!formData.monthlyRent || formData.monthlyRent <= 0) {
        setError("monthlyRent", "Monthly rent must be greater than 0");
        isValid = false;
      }

      // Room type validation
      if (!formData.roomType) {
        setError("roomType", "Room type is required");
        isValid = false;
      }

      // Location validation
      if (!formData.location.address.trim()) {
        setError("address", "Address is required");
        isValid = false;
      }

      if (!formData.location.city.trim()) {
        setError("city", "City is required");
        isValid = false;
      }

      if (!formData.location.state.trim()) {
        setError("state", "State is required");
        isValid = false;
      }

      if (!formData.location.pincode.trim()) {
        setError("pincode", "Pincode is required");
        isValid = false;
      } else if (!/^[1-9][0-9]{5}$/.test(formData.location.pincode)) {
        setError("pincode", "Invalid pincode format");
        isValid = false;
      }

      // Coordinates validation
      if (
        !formData.location.coordinates.lat ||
        !formData.location.coordinates.lng
      ) {
        setError("coordinates", "Please select location on map");
        isValid = false;
      }

      // Images validation
      if (imagePreview.value.length === 0) {
        setError("images", "At least one image is required");
        isValid = false;
      }

      return isValid;
    };

    const setError = (field: keyof typeof errors, message: string) => {
      errors[field] = message;
    };

    const clearError = (field: keyof typeof errors) => {
      errors[field] = "";
    };

    const clearAllErrors = () => {
      Object.keys(errors).forEach((key) => {
        errors[key as keyof typeof errors] = "";
      });
    };

    // Upload images to server
    const uploadImages = async (): Promise<string[]> => {
      const filesToUpload = imagePreview.value.filter((img) => img.file);

      if (filesToUpload.length === 0) {
        // Return existing URLs if no new files to upload
        return imagePreview.value.map((img) => img.url);
      }

      // Extract files from preview objects
      const files = filesToUpload
        .map((img) => img.file)
        .filter(Boolean) as File[];

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/upload/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload images");
      }

      const result = await response.json();

      // Combine existing URLs with newly uploaded URLs
      const existingUrls = imagePreview.value
        .filter((img) => !img.file)
        .map((img) => img.url);
      return [...existingUrls, ...result.data.urls];
    };

    // Handle form submission
    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      isSubmitting.value = true;

      try {
        // Upload images first
        const uploadedImageUrls = await uploadImages();

        // Prepare form data for submission
        const submitData = {
          ...formData,
          images: uploadedImageUrls,
        };

        // Call the onSubmit prop
        props.onSubmit(submitData);
      } catch (error) {
        console.error("Form submission error:", error);
        submitError.value =
          error instanceof Error ? error.message : "Failed to create listing";
      } finally {
        isSubmitting.value = false;
      }
    };

    // Handle cancel
    const handleCancel = () => {
      props.onCancel();
    };

    // Watch for changes in address to potentially update map
    watch(
      () => formData.location.pincode,
      async (newPincode) => {
        if (newPincode && /^[1-9][0-9]{5}$/.test(newPincode)) {
          // Could implement geocoding here to auto-update map location
        }
      }
    );

    return {
      formData,
      errors,
      isSubmitting,
      imagePreview,
      availableAmenities,
      handleSubmit,
      handleCancel,
      handleImageUpload,
      removeImage,
      onCoordinateChange,
      submitError,
    };
  },
  template: `
    <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEditing ? "Edit Room Listing" : "Create New Room Listing" }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              for="title"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Title *
            </label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              :class="{ 'border-red-500': errors.title }"
              placeholder="e.g., Spacious Single Room in Central Location"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-600">
              {{ errors.title }}
            </p>
          </div>

          <div>
            <label
              for="monthlyRent"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Monthly Rent (₹) *
            </label>
            <input
              id="monthlyRent"
              v-model.number="formData.monthlyRent"
              type="number"
              required
              min="0"
              step="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              :class="{ 'border-red-500': errors.monthlyRent }"
              placeholder="10000"
            />
            <p v-if="errors.monthlyRent" class="mt-1 text-sm text-red-600">
              {{ errors.monthlyRent }}
            </p>
          </div>
        </div>

        <!-- Room Type -->
        <div>
          <label
            for="roomType"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Room Type *
          </label>
          <select
            id="roomType"
            v-model="formData.roomType"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            :class="{ 'border-red-500': errors.roomType }"
          >
            <option value="">Select Room Type</option>
            <option value="single">Single Room</option>
            <option value="double">Double Room</option>
            <option value="shared">Shared Room</option>
            <option value="studio">Studio Apartment</option>
            <option value="1bhk">1 BHK</option>
            <option value="2bhk">2 BHK</option>
            <option value="3bhk">3 BHK</option>
            <option value="pg">PG Accommodation</option>
            <option value="hostel">Hostel</option>
          </select>
          <p v-if="errors.roomType" class="mt-1 text-sm text-red-600">
            {{ errors.roomType }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Description *
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            required
            rows="4"
            maxlength="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            :class="{ 'border-red-500': errors.description }"
            placeholder="Describe your room, including features, nearby amenities, and any special conditions..."
          ></textarea>
          <div class="flex justify-between mt-1">
            <p v-if="errors.description" class="text-sm text-red-600">
              {{ errors.description }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formData.description.length }}/1000 characters
            </p>
          </div>
        </div>

        <!-- Location Section -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Location Details</h3>

          <div class="space-y-4">
            <div>
              <label
                for="address"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Address *
              </label>
              <textarea
                id="address"
                v-model="formData.location.address"
                required
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                :class="{ 'border-red-500': errors.address }"
                placeholder="Enter complete address with landmarks"
              ></textarea>
              <p v-if="errors.address" class="mt-1 text-sm text-red-600">
                {{ errors.address }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  for="city"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  City *
                </label>
                <input
                  id="city"
                  v-model="formData.location.city"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  :class="{ 'border-red-500': errors.city }"
                  placeholder="Mumbai"
                />
                <p v-if="errors.city" class="mt-1 text-sm text-red-600">
                  {{ errors.city }}
                </p>
              </div>

              <div>
                <label
                  for="state"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  State *
                </label>
                <input
                  id="state"
                  v-model="formData.location.state"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  :class="{ 'border-red-500': errors.state }"
                  placeholder="Maharashtra"
                />
                <p v-if="errors.state" class="mt-1 text-sm text-red-600">
                  {{ errors.state }}
                </p>
              </div>

              <div>
                <label
                  for="pincode"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pincode *
                </label>
                <input
                  id="pincode"
                  v-model="formData.location.pincode"
                  type="text"
                  required
                  pattern="[1-9][0-9]{5}"
                  maxlength="6"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  :class="{ 'border-red-500': errors.pincode }"
                  placeholder="400001"
                />
                <p v-if="errors.pincode" class="mt-1 text-sm text-red-600">
                  {{ errors.pincode }}
                </p>
              </div>
            </div>

            <!-- Coordinates Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Coordinates (Latitude & Longitude) *
              </label>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="latitude"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    v-model.number="formData.location.coordinates.lat"
                    type="number"
                    step="any"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                    placeholder="19.076"
                    @input="onCoordinateChange"
                  />
                </div>
                <div>
                  <label
                    for="longitude"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    v-model.number="formData.location.coordinates.lng"
                    type="number"
                    step="any"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                    placeholder="72.8777"
                    @input="onCoordinateChange"
                  />
                </div>
              </div>

              <p v-if="errors.coordinates" class="mt-1 text-sm text-red-600">
                {{ errors.coordinates }}
              </p>
              <p
                v-if="
                  formData.location.coordinates.lat &&
                  formData.location.coordinates.lng
                "
                class="mt-1 text-sm text-gray-600"
              >
                Selected: {{ formData.location.coordinates.lat.toFixed(6) }},
                {{ formData.location.coordinates.lng.toFixed(6) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Amenities -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Amenities</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="amenity in availableAmenities"
              :key="amenity"
              class="flex items-center"
            >
              <input
                type="checkbox"
                :value="amenity"
                v-model="formData.amenities"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">{{ amenity }}</span>
            </label>
          </div>
        </div>

        <!-- Image Upload -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Room Images</h3>
          <div class="space-y-4">
            <div>
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
              />
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Images
              </button>
              <p class="mt-1 text-sm text-gray-500">
                Upload 1-10 images (max 5MB each)
              </p>
            </div>

            <!-- Image Preview -->
            <div
              v-if="imagePreview.length > 0"
              class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              <div
                v-for="(image, index) in imagePreview"
                :key="index"
                class="relative"
              >
                <img
                  :src="image.url"
                  :alt="\`Room image \${index + 1}\`"
                  class="w-full h-32 object-cover rounded-md border border-gray-300"
                />
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
            <p v-if="errors.images" class="text-sm text-red-600">
              {{ errors.images }}
            </p>
          </div>
        </div>

        <!-- General Error Message -->
        <div v-if="submitError" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-800">{{ submitError }}</p>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="border-t pt-6 flex justify-end space-x-4">
          <button
            type="button"
            @click="handleCancel"
            class="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSubmitting">
              {{ isEditing ? "Updating..." : "Creating..." }}
            </span>
            <span v-else>
              {{ isEditing ? "Update Listing" : "Create Listing" }}
            </span>
          </button>
        </div>
      </form>
    </div>
  `,
});
