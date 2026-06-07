import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface TextareaProps {
    name?: string;
    label?: string;
    error?: { message?: string };
    value?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    helpText?: string;
    props?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            name,
            label,
            error,
            value = "",
            disabled = false,
            required,
            maxLength = 2000,
            onChange,
            onBlur,
            placeholder,
            rows = 3,
            helpText,
            props,
        },
        ref,
    ) => {
        return (
            <div className='w-full mb-4'>
                {label && (
                    <label htmlFor={name} className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {label}
                        {required && <span className='text-red-500 ml-1'>*</span>}
                    </label>
                )}

                <div className='relative mt-1'>
                    <textarea
                        {...props}
                        id={name}
                        name={name}
                        ref={ref}
                        value={value}
                        disabled={disabled}
                        required={required}
                        maxLength={maxLength}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        rows={rows}
                        className={`
              w-full 
              px-3 
              py-2 
              border 
              rounded-md 
              shadow-sm 
              focus:outline-none 
              focus:ring-2 
              transition 
              duration-300
              ${error
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            }
              ${disabled ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-800"}
              text-gray-900 dark:text-gray-100
              sm:text-sm
              resize-none
            `}
                    />
                </div>

                <div className="flex justify-between items-center mt-1">
                    <div className="font-small text-sm">
                        {helpText && !error && <p className='text-gray-500 dark:text-gray-400'>{helpText}</p>}
                        {error && (
                            <p className='text-red-600 flex items-center'>
                                <AlertCircle size={14} className='mr-1' /> {error.message}
                            </p>
                        )}
                    </div>
                    <div className="text-xs text-gray-400">
                        {value.length} of {maxLength}
                    </div>
                </div>
            </div>
        );
    },
);

export default Textarea;
