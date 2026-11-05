import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
  label?: string;
  error?: string;
  hint?: string;
}

export const fieldClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export const fieldErrorClasses = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

export function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label ? <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span> : null}
      <input {...props} className={`${fieldClasses} ${error ? fieldErrorClasses : ""} ${className}`} />
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
