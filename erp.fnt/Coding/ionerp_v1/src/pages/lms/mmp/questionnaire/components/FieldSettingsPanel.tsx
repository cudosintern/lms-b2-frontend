import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormClearErrors,
} from "react-hook-form";
import { FIELD_SETTING_PLACEHOLDER } from "../questionnaireConstants";
import {
  FieldSettingOption,
  QuestionnaireBuilderFormValues,
} from "../responseInterface";

export const FIELD_SETTING_FORM_NAME = "field_settings.field_setting_id" as const;

interface FieldSettingsPanelProps {
  control: Control<QuestionnaireBuilderFormValues>;
  clearErrors: UseFormClearErrors<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  options: FieldSettingOption[];
  compact?: boolean;
  hidePlaceholder?: boolean;
  createMode?: boolean;
}

const FieldSettingsPanel: React.FC<FieldSettingsPanelProps> = ({
  control,
  clearErrors,
  errors,
  options,
  compact = false,
  hidePlaceholder = false,
  createMode = false,
}) => (
  <div
    className={`grid grid-cols-1 items-center gap-2 ${
      createMode
        ? "md:grid-cols-[200px_760px]"
        : "md:grid-cols-[200px_minmax(0,58%)]"
    }`}
  >
    <Controller
      name={FIELD_SETTING_FORM_NAME}
      control={control}
      render={({ field }) => (
        <>
          <label className="!text-[15px] font-semibold">
            Field Setting: <span className="text-red-500">*</span>
          </label>
          <div>
            <select
              className={`w-full rounded border px-4 py-2 text-sm ${
                compact ? "h-10" : "h-10"
              } ${
                errors.field_settings?.field_setting_id
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={
                field.value === "" ||
                field.value === null ||
                field.value === undefined
                  ? ""
                  : String(field.value)
              }
              onChange={(event) => {
                const value = event.target.value;
                field.onChange(value);
                clearErrors(FIELD_SETTING_FORM_NAME);
              }}
              onBlur={field.onBlur}
            >
              {!hidePlaceholder && (
                <option value="">{FIELD_SETTING_PLACEHOLDER}</option>
              )}
              {options.map((option) => (
                <option
                  key={option.field_setting_id}
                  value={String(option.field_setting_id)}
                >
                  {option.field_setting_desc}
                </option>
              ))}
            </select>
            {errors.field_settings?.field_setting_id && (
              <p className="text-sm text-red-600">
                {String(errors.field_settings.field_setting_id.message)}
              </p>
            )}
          </div>
        </>
      )}
    />
  </div>
);

export default FieldSettingsPanel;
