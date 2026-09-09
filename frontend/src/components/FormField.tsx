import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface WrapperProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ label, required, hint, children }: WrapperProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

export function TextField({
  label,
  required,
  hint,
  ...props
}: Omit<WrapperProps, "children"> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} required={required} hint={hint}>
      <input className={inputClass} {...props} />
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  required,
  hint,
  children,
  ...props
}: WrapperProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label} required={required} hint={hint}>
      <select className={inputClass} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  required,
  hint,
  ...props
}: Omit<WrapperProps, "children"> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} required={required} hint={hint}>
      <textarea className={`${inputClass} min-h-24 resize-y`} {...props} />
    </FieldWrapper>
  );
}
