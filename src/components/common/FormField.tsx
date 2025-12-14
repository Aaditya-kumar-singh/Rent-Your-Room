"use client";

import React, { forwardRef, useState } from "react";
import { FieldError } from "./ErrorDisplay";

interface BaseFieldProps {
  label?: string;
  error?: string;
  warning?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  helpText?: string;
  showOptional?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "tel" | "number" | "url";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

interface TextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  resize?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  description?: string;
}

interface FileFieldProps extends BaseFieldProps {
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  onBlur?: () => void;
  maxSize?: number; // in bytes
  preview?: boolean;
  currentFiles?: File[];
}

// Base field wrapper component
const FieldWrapper: React.FC<{
  label?: string;
  required?: boolean;
  error?: string;
  warning?: string;
  helpText?: string;
  showOptional?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}> = ({
  label,
  required,
  error,
  warning,
  helpText,
  showOptional,
  className = "",
  labelClassName = "",
  children,
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {!required && showOptional && (
            <span className="text-gray-500 ml-1 font-normal">(optional)</span>
          )}
        </label>
      )}
      {children}
      {helpText && !error && !warning && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
      <FieldError error={error} warning={warning} />
    </div>
  );
};

// Input field component
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      type = "text",
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      warning,
      required,
      disabled,
      className = "",
      labelClassName = "",
      helpText,
      showOptional,
      maxLength,
      minLength,
      pattern,
      autoComplete,
      leftIcon,
      rightIcon,
      onRightIconClick,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === "password" && showPassword ? "text" : type;

    const baseInputClasses = `
      block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
      placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
      ${
        warning && !error
          ? "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
          : ""
      }
      ${leftIcon ? "pl-10" : ""}
      ${rightIcon || type === "password" ? "pr-10" : ""}
    `;

    return (
      <FieldWrapper
        label={label}
        required={required}
        error={error}
        warning={warning}
        helpText={helpText}
        showOptional={showOptional}
        className={className}
        labelClassName={labelClassName}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">{leftIcon}</div>
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            autoComplete={autoComplete}
            className={baseInputClasses}
          />

          {(rightIcon || type === "password") && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {type === "password" ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRightIconClick}
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={!onRightIconClick}
                >
                  {rightIcon}
                </button>
              )}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);

InputField.displayName = "InputField";

// TextArea field component
export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  warning,
  required,
  disabled,
  className = "",
  labelClassName = "",
  helpText,
  showOptional,
  rows = 3,
  maxLength,
  minLength,
  resize = true,
}) => {
  const textAreaClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
    ${
      warning && !error
        ? "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
        : ""
    }
    ${!resize ? "resize-none" : "resize-vertical"}
  `;

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      warning={warning}
      helpText={helpText}
      showOptional={showOptional}
      className={className}
      labelClassName={labelClassName}
    >
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          minLength={minLength}
          className={textAreaClasses}
        />
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

// Select field component
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
  warning,
  required,
  disabled,
  className = "",
  labelClassName = "",
  helpText,
  showOptional,
}) => {
  const selectClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    focus:outline-none focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
    ${
      warning && !error
        ? "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
        : ""
    }
  `;

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      warning={warning}
      helpText={helpText}
      showOptional={showOptional}
      className={className}
      labelClassName={labelClassName}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={selectClasses}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

// Checkbox field component
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  checked,
  onChange,
  onBlur,
  description,
  error,
  warning,
  required,
  disabled,
  className = "",
  labelClassName = "",
  helpText,
}) => {
  return (
    <FieldWrapper
      error={error}
      warning={warning}
      helpText={helpText}
      className={className}
    >
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`
              h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? "border-red-300 focus:ring-red-500" : ""}
            `}
          />
        </div>
        <div className="ml-3">
          {label && (
            <label
              className={`text-sm font-medium text-gray-700 ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </FieldWrapper>
  );
};

// File field component
export const FileField: React.FC<FileFieldProps> = ({
  label,
  accept,
  multiple,
  onChange,
  onBlur,
  error,
  warning,
  required,
  disabled,
  className = "",
  labelClassName = "",
  helpText,
  showOptional,
  maxSize,
  preview,
  currentFiles = [],
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    onChange(files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      warning={warning}
      helpText={helpText}
      showOptional={showOptional}
      className={className}
      labelClassName={labelClassName}
    >
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"}
          ${error ? "border-red-300" : ""}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-gray-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => onChange(e.target.files)}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          {accept && (
            <p className="text-xs text-gray-500">
              {accept.split(",").join(", ")}
            </p>
          )}
          {maxSize && (
            <p className="text-xs text-gray-500">
              Max size: {formatFileSize(maxSize)}
            </p>
          )}
        </label>
      </div>

      {/* File preview */}
      {preview && currentFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {currentFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </FieldWrapper>
  );
};
