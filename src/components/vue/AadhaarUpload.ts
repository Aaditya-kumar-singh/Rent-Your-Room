import { defineComponent, ref, computed } from "vue";

interface UploadResponse {
  success: boolean;
  data?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    documentType: string;
    uploadedAt: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

interface VerificationResponse {
  success: boolean;
  data?: {
    verificationReport: {
      documentId: string;
      userId: string;
      verificationStatus: "pending" | "verified" | "rejected";
      verificationDate: string;
      verificationMethod: string;
      confidence: number;
      issues: string[];
      extractedData: {
        aadhaarNumber?: string;
        name?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
      };
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
  name: "AadhaarUpload",
  props: {
    onVerificationComplete: {
      type: Function,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const selectedFile = ref<File | null>(null);
    const aadhaarNumber = ref("");
    const uploadedFileUrl = ref("");
    const isUploading = ref(false);
    const isVerifying = ref(false);
    const uploadError = ref("");
    const verificationError = ref("");
    const verificationResult = ref<VerificationResponse["data"] | null>(null);
    const dragOver = ref(false);

    const isValidAadhaarNumber = computed(() => {
      if (!aadhaarNumber.value) return true; // Optional field
      const cleanNumber = aadhaarNumber.value.replace(/[\s-]/g, "");
      return (
        /^\d{12}$/.test(cleanNumber) &&
        !cleanNumber.startsWith("0") &&
        !cleanNumber.startsWith("1")
      );
    });

    const canUpload = computed(() => {
      return selectedFile.value && !isUploading.value && !props.disabled;
    });

    const canVerify = computed(() => {
      return uploadedFileUrl.value && !isVerifying.value && !props.disabled;
    });

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatAadhaarNumber = (value: string): string => {
      const cleanValue = value.replace(/[\s-]/g, "");
      if (cleanValue.length <= 4) return cleanValue;
      if (cleanValue.length <= 8)
        return `${cleanValue.slice(0, 4)}-${cleanValue.slice(4)}`;
      return `${cleanValue.slice(0, 4)}-${cleanValue.slice(
        4,
        8
      )}-${cleanValue.slice(8, 12)}`;
    };

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFile(target.files[0]);
      }
    };

    const handleFile = (file: File) => {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        uploadError.value =
          "Invalid file type. Please upload JPEG, PNG, WebP, or PDF files only.";
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        uploadError.value = "File size too large. Maximum allowed size is 5MB.";
        return;
      }

      selectedFile.value = file;
      uploadError.value = "";
      verificationError.value = "";
      verificationResult.value = null;
      uploadedFileUrl.value = "";
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      dragOver.value = true;
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragOver.value = false;
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      dragOver.value = false;

      if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        handleFile(event.dataTransfer.files[0]);
      }
    };

    const uploadFile = async () => {
      if (!selectedFile.value) return;

      isUploading.value = true;
      uploadError.value = "";

      try {
        const formData = new FormData();
        formData.append("file", selectedFile.value);
        formData.append("documentType", "aadhaar");

        const response = await fetch("/api/upload/documents", {
          method: "POST",
          body: formData,
        });

        const data: UploadResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Upload failed");
        }

        if (data.success && data.data) {
          uploadedFileUrl.value = data.data.fileUrl;
          // Auto-verify after successful upload
          await verifyDocument();
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Upload error:", error);
        uploadError.value =
          error instanceof Error ? error.message : "Upload failed";
      } finally {
        isUploading.value = false;
      }
    };

    const verifyDocument = async () => {
      if (!uploadedFileUrl.value || !selectedFile.value) return;

      isVerifying.value = true;
      verificationError.value = "";

      try {
        const requestBody = {
          fileUrl: uploadedFileUrl.value,
          fileType: selectedFile.value.type,
          fileSize: selectedFile.value.size,
          aadhaarNumber: aadhaarNumber.value.replace(/[\s-]/g, "") || undefined,
        };

        const response = await fetch("/api/verify/aadhaar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data: VerificationResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Verification failed");
        }

        if (data.success && data.data) {
          verificationResult.value = data.data;
          // Notify parent component
          props.onVerificationComplete({
            fileUrl: uploadedFileUrl.value,
            verified:
              data.data.verificationReport.verificationStatus === "verified",
            verificationData: data.data.verificationReport,
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Verification error:", error);
        verificationError.value =
          error instanceof Error ? error.message : "Verification failed";
      } finally {
        isVerifying.value = false;
      }
    };

    const resetUpload = () => {
      selectedFile.value = null;
      aadhaarNumber.value = "";
      uploadedFileUrl.value = "";
      uploadError.value = "";
      verificationError.value = "";
      verificationResult.value = null;
    };

    const handleAadhaarNumberInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value.replace(/[\s-]/g, "");
      if (value.length <= 12) {
        aadhaarNumber.value = formatAadhaarNumber(value);
      }
    };

    return {
      selectedFile,
      aadhaarNumber,
      uploadedFileUrl,
      isUploading,
      isVerifying,
      uploadError,
      verificationError,
      verificationResult,
      dragOver,
      isValidAadhaarNumber,
      canUpload,
      canVerify,
      formatFileSize,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      uploadFile,
      verifyDocument,
      resetUpload,
      handleAadhaarNumberInput,
    };
  },
  template: `
    <div class="aadhaar-upload-container">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Aadhaar Verification</h3>
        <p class="text-sm text-gray-600">
          Upload your Aadhaar card for identity verification. Accepted formats: JPEG, PNG, WebP, PDF (Max 5MB)
        </p>
      </div>

      <!-- Aadhaar Number Input (Optional) -->
      <div class="mb-4">
        <label for="aadhaar-number" class="block text-sm font-medium text-gray-700 mb-2">
          Aadhaar Number (Optional)
        </label>
        <input
          id="aadhaar-number"
          type="text"
          :value="aadhaarNumber"
          @input="handleAadhaarNumberInput"
          placeholder="1234-5678-9012"
          maxlength="14"
          :disabled="disabled || isUploading || isVerifying"
          :class="[
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            isValidAadhaarNumber ? 'border-gray-300' : 'border-red-300',
            disabled || isUploading || isVerifying ? 'bg-gray-100 cursor-not-allowed' : ''
          ]"
        />
        <p v-if="!isValidAadhaarNumber" class="mt-1 text-sm text-red-600">
          Please enter a valid 12-digit Aadhaar number
        </p>
      </div>

      <!-- File Upload Area -->
      <div
        v-if="!uploadedFileUrl"
        :class="[
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        ]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="space-y-4">
          <div class="text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-lg font-medium">
              {{ dragOver ? 'Drop your Aadhaar document here' : 'Upload Aadhaar Document' }}
            </p>
            <p class="text-sm">Drag and drop or click to select</p>
          </div>
          
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            @change="handleFileSelect"
            :disabled="disabled"
            class="hidden"
            id="file-input"
          />
          
          <label
            for="file-input"
            :class="[
              'inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors',
              disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
            ]"
          >
            Choose File
          </label>
        </div>
      </div>

      <!-- Selected File Info -->
      <div v-if="selectedFile && !uploadedFileUrl" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              @click="uploadFile"
              :disabled="!canUpload"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                canUpload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              {{ isUploading ? 'Uploading...' : 'Upload' }}
            </button>
            <button
              @click="resetUpload"
              :disabled="isUploading || isVerifying"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Progress -->
      <div v-if="isUploading" class="mt-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span class="text-sm text-gray-600">Uploading document...</span>
        </div>
      </div>

      <!-- Verification Progress -->
      <div v-if="isVerifying" class="mt-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span class="text-sm text-gray-600">Verifying document...</span>
        </div>
      </div>

      <!-- Upload Error -->
      <div v-if="uploadError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-800">{{ uploadError }}</p>
        </div>
      </div>

      <!-- Verification Error -->
      <div v-if="verificationError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-800">{{ verificationError }}</p>
        </div>
      </div>

      <!-- Verification Result -->
      <div v-if="verificationResult" class="mt-4">
        <div
          :class="[
            'p-4 border rounded-lg',
            verificationResult.verificationReport.verificationStatus === 'verified'
              ? 'bg-green-50 border-green-200'
              : verificationResult.verificationReport.verificationStatus === 'rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          ]"
        >
          <div class="flex items-center mb-3">
            <svg
              v-if="verificationResult.verificationReport.verificationStatus === 'verified'"
              class="w-5 h-5 text-green-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg
              v-else-if="verificationResult.verificationReport.verificationStatus === 'rejected'"
              class="w-5 h-5 text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-yellow-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4
              :class="[
                'font-medium',
                verificationResult.verificationReport.verificationStatus === 'verified'
                  ? 'text-green-800'
                  : verificationResult.verificationReport.verificationStatus === 'rejected'
                  ? 'text-red-800'
                  : 'text-yellow-800'
              ]"
            >
              {{ verificationResult.verificationReport.verificationStatus === 'verified' ? 'Document Verified' : 
                 verificationResult.verificationReport.verificationStatus === 'rejected' ? 'Verification Failed' : 'Verification Pending' }}
            </h4>
          </div>
          
          <div class="text-sm space-y-2">
            <p
              :class="[
                verificationResult.verificationReport.verificationStatus === 'verified'
                  ? 'text-green-700'
                  : verificationResult.verificationReport.verificationStatus === 'rejected'
                  ? 'text-red-700'
                  : 'text-yellow-700'
              ]"
            >
              {{ verificationResult.message }}
            </p>
            
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <span class="font-medium">Confidence:</span>
                {{ Math.round(verificationResult.verificationReport.confidence * 100) }}%
              </div>
              <div>
                <span class="font-medium">Method:</span>
                {{ verificationResult.verificationReport.verificationMethod.replace('_', ' ').toUpperCase() }}
              </div>
            </div>
            
            <div v-if="verificationResult.verificationReport.extractedData.name" class="mt-3 pt-3 border-t border-gray-200">
              <h5 class="font-medium mb-2">Extracted Information:</h5>
              <div class="grid grid-cols-1 gap-2 text-sm">
                <div v-if="verificationResult.verificationReport.extractedData.name">
                  <span class="font-medium">Name:</span> {{ verificationResult.verificationReport.extractedData.name }}
                </div>
                <div v-if="verificationResult.verificationReport.extractedData.aadhaarNumber">
                  <span class="font-medium">Aadhaar:</span> 
                  {{ verificationResult.verificationReport.extractedData.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
});
