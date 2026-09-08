import React from "react";
import Select from "react-select";
import { InstructorOption } from "./topicUi";
interface Props { label: string; options: InstructorOption[]; value: number[]; locked?: number[]; disabled?: boolean; onChange: (ids: number[]) => void; }
export default function InstructorSelect({ label, options, value, locked = [], disabled, onChange }: Props) {
  return <Select<InstructorOption, true> isMulti aria-label={label} classNamePrefix="mti-select"
    options={options} value={options.filter(option => value.includes(option.value))}
    isDisabled={disabled} isClearable={false} closeMenuOnSelect={false}
    placeholder="Select Faculty" noOptionsMessage={() => "No course instructors available"}
    isOptionDisabled={option => !value.includes(option.value) && value.length >= 3}
    onChange={items => onChange(Array.from(new Set([...locked, ...items.map(item => item.value)])))}
    styles={{ control: base => ({ ...base, minHeight: 32, fontSize: 12 }), valueContainer: base => ({ ...base, padding: "0 6px" }), dropdownIndicator: base => ({ ...base, padding: 4 }), menu: base => ({ ...base, zIndex: 20 }), multiValueRemove: (base, state) => ({ ...base, display: locked.includes(state.data.value) ? "none" : base.display }) }} />;
}
