import { defineComponent, ref, computed } from "vue";

interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
}



interface BookingResponse {
  success: boolean;
  data?: {
    booking: {
      _id: string;
      roomId: string;
      seekerId: string;
      ownerId: string;
      status: string;
      message?: string;
    };
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

export default defineComponent({
  name: "BookingForm",
  props: {
    room: {
      type: Object as () => Room,
      required: true,
    },
    onBookingComplete: {
      type: Function,
      required: true,
    },
    onCancel: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const message = ref("");
    const isSubmitting = ref(false);
    const submitError = ref("");
    const currentStep = ref(1);
    const totalSteps = 2;

    const canProceedToStep2 = computed(() => {
      return message.value.trim().length > 0;
    });

    const canSubmit = computed(() => {
      return canProceedToStep2.value && !isSubmitting.value;
    });

    const stepTitles = [
      "Booking Details",
      "Review & Submit",
    ];

    const nextStep = () => {
      if (currentStep.value < totalSteps) {
        if (currentStep.value === 1 && canProceedToStep2.value) {
          currentStep.value = 2;
        }
      }
    };

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const submitBooking = async () => {
      if (!canSubmit.value) return;

      isSubmitting.value = true;
      submitError.value = "";

      try {
        const bookingData = {
          roomId: props.room._id,
          message: message.value.trim(),
          payment: {
            amount: props.room.monthlyRent,
          },
        };

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        });

        const data: BookingResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Booking failed");
        }

        if (data.success && data.data) {
          props.onBookingComplete(data.data.booking);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Booking error:", error);
        submitError.value =
          error instanceof Error ? error.message : "Booking failed";
      } finally {
        isSubmitting.value = false;
      }
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return {
      message,
      isSubmitting,
      submitError,
      currentStep,
      totalSteps,
      stepTitles,
      canProceedToStep2,
      canSubmit,
      nextStep,
      prevStep,
      submitBooking,
      formatCurrency,
    };
  },
  template: `
    <div class="booking-form-container">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Book This Room</h2>
        <p class="text-gray-600">Complete the booking process to reserve your room</p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div 
            v-for="step in totalSteps" 
            :key="step"
            class="flex items-center"
            :class="{ 'flex-1': step < totalSteps }"
          >
            <div
              :class="[
                'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium',
                step <= currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              ]"
            >
              {{ step }}
            </div>
            <div v-if="step < totalSteps" class="flex-1 mx-4">
              <div
                :class="[
                  'h-1 rounded',
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                ]"
              ></div>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-2">
          <span 
            v-for="(title, index) in stepTitles" 
            :key="index"
            :class="[
              'text-sm font-medium',
              index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'
            ]"
          >
            {{ title }}
          </span>
        </div>
      </div>

      <!-- Room Summary -->
      <div class="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Room Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-900">{{ room.title }}</h4>
            <p class="text-sm text-gray-600">{{ room.location.address }}</p>
            <p class="text-sm text-gray-600">{{ room.location.city }}, {{ room.location.state }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(room.monthlyRent) }}</p>
            <p class="text-sm text-gray-600">per month</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <span class="text-sm font-medium text-gray-600">
                {{ room.ownerId.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ room.ownerId.name }}</p>
              <p class="text-sm text-gray-600">Property Owner</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="min-h-[400px]">
        <!-- Step 1: Booking Details -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
              Message to Property Owner
            </label>
            <textarea
              id="message"
              v-model="message"
              rows="4"
              placeholder="Introduce yourself and explain why you're interested in this room..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">
              Tell the owner about yourself, your occupation, and why you're interested in this room.
            </p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="text-sm font-medium text-blue-800 mb-1">What happens next?</h4>
                <p class="text-sm text-blue-700">
                  After submitting your booking request, the property owner will review your application. They can then accept or decline your request.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Review & Submit -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 class="text-sm font-medium text-green-800 mb-1">Ready to Submit</h4>
                <p class="text-sm text-green-700">
                  Your booking request is ready to be submitted. Please review the details below.
                </p>
              </div>
            </div>
          </div>

          <!-- Booking Review -->
          <div class="border border-gray-200 rounded-lg p-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Booking Review</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 class="font-medium text-gray-900 mb-2">Room Details</h5>
                  <p class="text-sm text-gray-600">{{ room.title }}</p>
                  <p class="text-sm text-gray-600">{{ room.location.address }}</p>
                  <p class="text-sm text-gray-600">{{ room.location.city }}, {{ room.location.state }}</p>
                </div>
                <div>
                  <h5 class="font-medium text-gray-900 mb-2">Monthly Rent</h5>
                  <p class="text-xl font-bold text-blue-600">{{ formatCurrency(room.monthlyRent) }}</p>
                </div>
              </div>

              <div>
                <h5 class="font-medium text-gray-900 mb-2">Your Message</h5>
                <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {{ message || 'No message provided' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h5 class="font-medium text-gray-900 mb-2">Terms and Conditions</h5>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Your booking request will be sent to the property owner for review</li>
              <li>• The owner may accept or decline your request based on their criteria</li>
              <li>• If accepted, you will be notified and can proceed with payment</li>
              <li>• All personal information will be kept confidential and secure</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="submitError" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-800">{{ submitError }}</p>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-8 flex justify-between">
        <div>
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            :disabled="isSubmitting"
            class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="$emit('cancel')"
            :disabled="isSubmitting"
            class="ml-3 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        <div>
          <button
            v-if="currentStep < totalSteps"
            @click="nextStep"
            :disabled="(currentStep === 1 && !canProceedToStep2)"
            :class="[
              'px-6 py-2 text-sm font-medium rounded-lg transition-colors',
              (currentStep === 1 && canProceedToStep2)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            Next
          </button>
          
          <button
            v-if="currentStep === totalSteps"
            @click="submitBooking"
            :disabled="!canSubmit"
            :class="[
              'px-6 py-2 text-sm font-medium rounded-lg transition-colors',
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </div>
      </div>
    </div>
  `,
});
