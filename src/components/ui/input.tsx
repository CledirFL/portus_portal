import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        {...props}
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
          error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : ""
        } ${className}`}
      />
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
