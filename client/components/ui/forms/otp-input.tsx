'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function OtpInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    className
}: OtpInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Sync internal state if value is provided from outside (e.g. initial load or reset)
        if (value.length === length) {
            setOtp(value.split(""));
        } else if (value === "") {
            setOtp(new Array(length).fill(""));
        }
    }, [value, length]);

    const focusInput = (index: number) => {
        if (inputs.current[index]) {
            inputs.current[index]?.focus();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (isNaN(Number(val))) return;

        const newOtp = [...otp];
        // Take only the last character if user types fast
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        const combinedOtp = newOtp.join("");
        onChange(combinedOtp);

        // Move to next input if filled
        if (val && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                focusInput(index - 1);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const rawData = e.clipboardData.getData("text").trim();
        // Extract only the first 'length' digits, ignoring separators
        const data = rawData.replace(/\D/g, "").slice(0, length);
        if (!data) return;

        const newOtp = [...otp];
        data.split("").forEach((char, i) => {
            if (i < length) newOtp[i] = char;
        });
        setOtp(newOtp);
        onChange(newOtp.join(""));

        // Focus last input or the one after the last pasted digit
        const nextIndex = Math.min(data.length, length - 1);
        focusInput(nextIndex);
    };

    return (
        <div className={cn("flex justify-center gap-2 sm:gap-3", className)}>
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={cn(
                        "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none",
                        "bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10",
                        disabled && "opacity-50 cursor-not-allowed",
                        digit ? "border-primary bg-primary/5" : "border-border"
                    )}
                />
            ))}
        </div>
    );
}
