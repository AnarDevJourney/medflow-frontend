import { Form } from "antd";
import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

interface FormFieldProps {
  label: ReactNode;
  error?: FieldError;
  required?: boolean;
  extra?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

// AntD form row driven by React Hook Form: label, required mark and the
// field's error (client rule or server VALIDATION_ERROR) under the input
export function FormField({
  label,
  error,
  required,
  extra,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? "error" : undefined}
      help={error?.message}
      extra={extra}
      htmlFor={htmlFor}
    >
      {children}
    </Form.Item>
  );
}
