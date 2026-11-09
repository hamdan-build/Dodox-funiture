"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlStyles =
  "w-full border border-line bg-parchment px-4 py-3 text-[14px] text-ink placeholder:text-muted/60 transition-colors focus:border-bronze focus:outline-none disabled:opacity-60";

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-[#9a4a32]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

type InputProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & { id?: string };

export const TextField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        error={error}
        hint={hint}
        className={className}
      >
        <input
          id={inputId}
          ref={ref}
          className={cn(controlStyles, error && "border-[#b06a4f]")}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </FieldShell>
    );
  },
);
TextField.displayName = "TextField";

type TextareaProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { id?: string };

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        error={error}
        hint={hint}
        className={className}
      >
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={cn(controlStyles, "resize-y", error && "border-[#b06a4f]")}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </FieldShell>
    );
  },
);
TextAreaField.displayName = "TextAreaField";

type SelectProps = BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & { id?: string };

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        error={error}
        hint={hint}
        className={className}
      >
        <select
          id={inputId}
          ref={ref}
          className={cn(
            controlStyles,
            "appearance-none bg-[linear-gradient(45deg,transparent_50%,#7e5f3c_50%),linear-gradient(135deg,#7e5f3c_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%] bg-no-repeat pr-10",
            error && "border-[#b06a4f]",
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);
SelectField.displayName = "SelectField";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  error?: string;
};

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className={cn("w-full", className)}>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          ref={ref}
          className="mt-0.5 h-4 w-4 shrink-0 appearance-none border border-line bg-parchment checked:border-bronze checked:bg-bronze checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] bg-[length:12px] bg-center bg-no-repeat"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="mt-1.5 pl-7 text-[12px] text-[#9a4a32]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  ),
);
CheckboxField.displayName = "CheckboxField";

export { controlStyles };
