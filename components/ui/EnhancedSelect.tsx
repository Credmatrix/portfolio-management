import React from "react";
import { Select } from "./Select";

export interface SelectOption {
    value: string;
    label: string;
}

interface EnhancedSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function EnhancedSelect({
    value,
    onChange,
    options,
    placeholder,
    className,
    disabled
}: EnhancedSelectProps) {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value);
    };

    return (
        <Select
            value={value}
            onChange={handleChange}
            className={className}
            disabled={disabled}
            placeholder={placeholder}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </Select>
    );
}