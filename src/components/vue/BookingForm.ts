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

    const handleCancel = () => {
      props.onCancel();
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
      handleCancel,
    };
  },
  template: `
    <div class="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <!-- Top Decorative Bar -->
      <div class="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      <div class="p-6 sm:p-10">
        <!-- Header -->
        <div class="mb-10 text-center sm:text-left">
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Secure Your Stay</h2>
          <p class="text-lg text-gray-500">Complete the booking process to reserve your room.</p>
        </div>

        <!-- Stylish Progress Steps -->
        <div class="mb-10 relative">
          <div class="flex items-center justify-between relative z-10">
            <div 
              v-for="(title, index) in stepTitles" 
              :key="index"
              class="flex flex-col items-center"
            >
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                :class="[ 
                  index + 1 <= currentStep 
                    ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                ]"
              >
                {{ index + 1 }}
              </div>
              <span 
                class="mt-2 text-xs sm:text-sm font-medium transition-colors duration-300"
                :class="index + 1 <= currentStep ? 'text-indigo-600' : 'text-gray-400'"
              >
                {{ title }}
              </span>
            </div>
          </div>
          
          <!-- Connecting Line -->
          <div class="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-0">
            <div 
              class="h-full bg-indigo-500 transition-all duration-500 ease-out"
              :style="{ width: ((currentStep - 1) / (totalSteps - 1)) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Main Form Area -->
          <div class="flex-1 order-2 lg:order-1">
            <!-- Step Content -->
            <div class="min-h-[300px]">
              
              <!-- Step 1: Booking Details -->
              <transition 
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-4"
                mode="out-in"
              >
                <div v-if="currentStep === 1" key="step1" class="space-y-6">
                  <div>
                    <label for="message" class="block text-sm font-semibold text-gray-700 mb-2">
                      Message to Property Owner
                    </label>
                    <div class="relative">
                      <textarea
                        id="message"
                        v-model="message"
                        rows="5"
                        placeholder="Hi, I'm interested in this room perfectly located near my workplace..."
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
                      ></textarea>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 flex items-center">
                      <svg class="w-4 h-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Briefly introduce yourself and your reason for staying.
                    </p>
                  </div>

                  <div class="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div class="ml-3">
                        <h3 class="text-sm font-bold text-indigo-900">What happens next?</h3>
                        <div class="mt-1 text-sm text-indigo-700">
                          <p>The owner will review your profile and request. Once accepted, you'll receive a confirmation email to proceed properly.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 2: Review & Submit -->
                <div v-else-if="currentStep === 2" key="step2" class="space-y-6">
                  
                  <!-- Success Like Header -->
                  <div class="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-emerald-900">Ready to Request</h4>
                      <p class="text-sm text-emerald-700">Please review your booking details before sending.</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                     <div>
                        <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Details</h5>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 italic">
                          "{{ message || 'No specific message provided' }}"
                        </div>
                     </div>
                  </div>

                  <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h5 class="font-bold text-gray-900 mb-3 text-sm">Terms of Booking</h5>
                    <ul class="space-y-2 text-sm text-gray-600">
                      <li class="flex items-start">
                        <svg class="w-4 h-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        Request is subject to owner approval.
                      </li>
                       <li class="flex items-start">
                        <svg class="w-4 h-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        Payment details will be arranged after acceptance.
                      </li>
                       <li class="flex items-start">
                        <svg class="w-4 h-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        Your data is handled according to our privacy policy.
                      </li>
                    </ul>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Error Message -->
            <transition 
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
            >
              <div v-if="submitError" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
                <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-sm font-medium">{{ submitError }}</span>
              </div>
            </transition>

            <!-- Navigation Buttons -->
            <div class="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
              <div>
                <button
                  v-if="currentStep > 1"
                  @click="prevStep"
                  :disabled="isSubmitting"
                  class="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors focus:ring-2 focus:ring-gray-100 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  @click="handleCancel"
                  :disabled="isSubmitting"
                  class="ml-3 px-6 py-2.5 text-sm font-medium text-gray-500 bg-transparent hover:text-red-500 transition-colors disabled:opacity-50"
                  v-if="currentStep === 1"
                >
                  Cancel
                </button>
              </div>

              <div>
                <button
                  v-if="currentStep < totalSteps"
                  @click="nextStep"
                  :disabled="(currentStep === 1 && !canProceedToStep2)"
                  class="px-8 py-3 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 transform"
                  :class="[
                    (currentStep === 1 && canProceedToStep2)
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-300 hover:-translate-y-0.5'
                      : 'bg-gray-300 cursor-not-allowed shadow-none'
                  ]"
                >
                  Continue
                </button>
                
                <button
                  v-if="currentStep === totalSteps"
                  @click="submitBooking"
                  :disabled="!canSubmit"
                  class="flex items-center px-8 py-3 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 transform"
                  :class="[
                    canSubmit
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-300 hover:-translate-y-0.5'
                      : 'bg-gray-400 cursor-not-allowed shadow-none'
                  ]"
                >
                  <span v-if="isSubmitting" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                  <span v-else>Confirm Booking Request</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Side Panel: Room Summary -->
          <div class="w-full lg:w-80 order-1 lg:order-2">
            <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 sticky top-4">
              <div class="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                 <h3 class="font-bold text-slate-800">Booking Summary</h3>
                 <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Rent</span>
              </div>
              
              <div class="space-y-4">
                <div>
                   <p class="text-xs text-slate-500 uppercase tracking-widest font-semibold">Property</p>
                   <p class="font-bold text-slate-900 leading-tight">{{ room.title }}</p>
                   <p class="text-sm text-slate-600 mt-1 flex items-start">
                     <svg class="w-4 h-4 mr-1 mt-0.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                     {{ room.location.city }}, {{ room.location.state }}
                   </p>
                </div>

                <div class="pt-4 border-t border-slate-200">
                   <p class="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Owner</p>
                   <div class="flex items-center">
                      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {{ room.ownerId.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="ml-3">
                         <p class="text-sm font-semibold text-slate-800">{{ room.ownerId.name }}</p>
                         <p class="text-xs text-slate-500">Verified Owner</p>
                      </div>
                   </div>
                </div>

                <div class="bg-white rounded-xl p-4 mt-4 shadow-sm border border-slate-100">
                   <div class="flex justify-between items-end">
                      <span class="text-slate-500 text-sm font-medium">Monthly Rent</span>
                      <div class="text-right">
                         <span class="block text-2xl font-black text-indigo-600 tracking-tight">{{ formatCurrency(room.monthlyRent) }}</span>
                         <span class="text-xs text-slate-400">Includes basic utilities</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
});
