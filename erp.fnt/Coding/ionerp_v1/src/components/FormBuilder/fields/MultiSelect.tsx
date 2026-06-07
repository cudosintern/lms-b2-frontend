import React, { useState, useRef } from "react";
import { UseFormRegister } from "react-hook-form";
import ReactSelect, { components, InputAction } from "react-select";

interface MultiSelectProps {
    register?: UseFormRegister<any>;
    options: { label: string; value: any }[];
    isMulti?: boolean;
    label: string;
    required?: boolean;
    error?: any;
    placeholder?: string;
    name: string;
    value?: any;
    onChange: (value: any) => void;
    onBlur?: () => void;
    [key: string]: any;
}

export type Option = {
    value: any;
    label: string;
};

const MultiSelect = React.forwardRef<any, MultiSelectProps>(({ register, ...props }, ref) => {
    const [selectInput, setSelectInput] = React.useState<string>("");
    const isAllSelected = React.useRef<boolean>(false);
    const selectAllLabel = React.useRef<string>("Select all");
    const allOption = { value: "*", label: selectAllLabel.current };

    // Defensive string lowercasing
    const safeToLowerCase = (val: any) => {
        if (typeof val === 'string') return val.toLowerCase();
        if (val == null) return "";
        return String(val).toLowerCase();
    };

    const filterOptions = (options: any[], input: string) => {
        if (!options || !Array.isArray(options)) return [];
        const lowerInput = safeToLowerCase(input);
        return options.filter((opt: any) => {
            const label = typeof opt === 'object' && opt !== null ? (opt.label || "") : opt;
            return safeToLowerCase(label).includes(lowerInput);
        });
    };

    // Safe comparator for sorting (handles strings and numbers gracefully)
    const comparator = (v1: any, v2: any) => {
        const val1 = typeof v1 === 'object' && v1 !== null ? v1.value : v1;
        const val2 = typeof v2 === 'object' && v2 !== null ? v2.value : v2;
        if (typeof val1 === 'number' && typeof val2 === 'number') return val1 - val2;
        return safeToLowerCase(val1).localeCompare(safeToLowerCase(val2));
    };

    // Normalize value for ReactSelect (expects Option objects for chip rendering)
    const normalizedValue = React.useMemo(() => {
        if (!props.value) return props.isMulti ? [] : null;
        const valArray = Array.isArray(props.value) ? props.value : [props.value];

        const normalized = valArray.map((val: any) => {
            if (typeof val === 'object' && val !== null && 'label' in val) return val;
            // If it's a primitive value, find the full option object from props.options
            const found = props.options?.find((opt: any) => {
                const optVal = typeof opt === 'object' && opt !== null ? opt.value : opt;
                // Use safe comparison (string to string) if necessary to avoid cast warnings
                return String(optVal) === String(val);
            });
            return found || { label: String(val), value: val };
        });

        return props.isMulti ? normalized : normalized[0] || null;
    }, [props.value, props.options, props.isMulti]);

    const filteredOptions = filterOptions(props.options, selectInput);

    const OptionComponent = (props: any) => (
        <components.Option {...props}>
            <div className="flex items-center">
                <input
                    key={props.value}
                    type='checkbox'
                    checked={props.isSelected || isAllSelected.current}
                    onChange={() => { }}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-[#437880] focus:ring-[#437880]"
                />
                <label className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    {props.label}
                </label>
            </div>
        </components.Option>
    );

    const InputComponent = (props: any) => (
        <components.Input autoFocus={props.selectProps.menuIsOpen} {...props}>
            {props.children}
        </components.Input>
    );

    const customFilterOption = (opt: any, input: string) => {
        const data = opt.data || opt;
        const value = data.value;
        const label = data.label || "";
        const lowerInput = safeToLowerCase(input);
        const lowerLabel = safeToLowerCase(label);
        return (value !== "*" && lowerLabel.includes(lowerInput)) ||
            (value === "*" && filteredOptions?.length > 0);
    };

    const onInputChange = (inputValue: string, event: { action: InputAction }) => {
        if (event.action === "input-change") setSelectInput(inputValue);
        else if (event.action === "menu-close" && selectInput !== "") setSelectInput("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.key === " " || e.key === "Enter") && !selectInput) e.preventDefault();
    };

    const handleChange = (selected: any, actionMeta: any) => {
        if (props.isMulti) {
            const selectedArray = Array.isArray(selected) ? [...selected] : selected ? [selected] : [];
            let result: any[] = selectedArray;

            const nValue = Array.isArray(normalizedValue) ? normalizedValue : [];

            if (
                selectedArray.length > 0 &&
                !isAllSelected.current &&
                (selectedArray[selectedArray.length - 1].value === allOption.value ||
                    JSON.stringify(filteredOptions) === JSON.stringify(selectedArray.sort(comparator)))
            ) {
                result = [
                    ...nValue,
                    ...props.options.filter(
                        (opt: any) => {
                            const label = typeof opt === 'object' && opt !== null ? opt.label : opt;
                            const value = typeof opt === 'object' && opt !== null ? opt.value : opt;
                            return safeToLowerCase(label).includes(safeToLowerCase(selectInput)) &&
                                !nValue.some((v: any) => String(v?.value ?? v) === String(value));
                        }
                    ),
                ].sort(comparator);
            } else if (
                selectedArray.length > 0 &&
                selectedArray[selectedArray.length - 1].value !== allOption.value &&
                JSON.stringify(selectedArray.sort(comparator)) !== JSON.stringify(filteredOptions)
            ) {
                result = selectedArray;
            } else {
                result = [
                    ...nValue.filter(
                        (opt: any) => {
                            const label = typeof opt === 'object' && opt !== null ? opt.label : opt;
                            return !safeToLowerCase(label).includes(safeToLowerCase(selectInput));
                        }
                    ),
                ];
            }

            // Consistently emit primitives (strings/numbers) as that's what Zod/Backend expects
            props.onChange(result.map(opt => (typeof opt === 'object' && opt !== null ? opt.value : opt)));
        } else {
            const val = selected && typeof selected === 'object' ? selected.value : selected;
            props.onChange(val);
        }
    };

    const customStyles = {
        multiValueLabel: (def: any) => ({
            ...def,
            backgroundColor: "transparent",
            fontSize: "0.875rem",
            color: "#374151",
        }),
        multiValue: (def: any) => ({
            ...def,
            backgroundColor: "#E5E7EB",
            borderRadius: "0.375rem",
        }),
        multiValueRemove: (def: any) => ({
            ...def,
            display: 'none', 
        }),
        valueContainer: (base: any) => ({
            ...base,
            maxHeight: "65px",
            overflow: "auto",
        }),
        control: (base: any, state: any) => ({
            ...base,
            borderColor: state.isFocused ? '#437880' : '#D1D5DB',
            boxShadow: state.isFocused ? '0 0 0 2px #437880' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#437880' : '#9ca3af',
            },
            borderRadius: '0.375rem',
            backgroundColor: 'white',
            minHeight: '38px',
            fontSize: '0.875rem',
            transition: 'none',
            outline: 'none',
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        menu: (def: any) => ({ ...def, zIndex: 9999 }),
        menuList: (base: any) => ({
            ...base,
            maxHeight: "250px",
            padding: "0px",
        }),
    };

    return (
        <div className={`${props.containerClassName || (props.label ? 'mb-4' : '')} w-full`}>
            {props.label && (
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    {props.label} {props.required ? <span className='text-red-500 ml-1'>*</span> : null}
                </label>
            )}
            <div>
                <ReactSelect
                    ref={ref}
                    {...props}
                    value={normalizedValue}
                    inputValue={selectInput}
                    onInputChange={onInputChange}
                    onKeyDown={onKeyDown}
                    options={props.isMulti ? (props.isSelectAll ? [allOption, ...(props.options || [])] : props.options) : props.options}
                    onChange={handleChange}
                    components={{
                        ...(props.isMulti ? { Option: OptionComponent } : {}),
                        Input: InputComponent,
                        ...props.components,
                    }}
                    filterOption={customFilterOption}
                    menuPlacement={props.menuPlacement ?? "auto"}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={customStyles}
                    isMulti={props.isMulti}
                    closeMenuOnSelect={!props.isMulti}
                    tabSelectsValue={false}
                    backspaceRemovesValue={false}
                    hideSelectedOptions={!props.isMulti}
                    blurInputOnSelect={!props.isMulti}
                    placeholder={props.placeholder || "Select..."}
                />
            </div>
            {props.error && <p className='mt-1 text-xs text-red-600'>{props.error.message}</p>}
        </div>
    );
});

export default MultiSelect;
