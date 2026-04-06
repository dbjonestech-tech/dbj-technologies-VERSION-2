import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId || generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-text-muted outline-none transition-all duration-300",
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-gray-200 focus:border-accent-blue/50 focus:bg-gray-50",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-red-400" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
