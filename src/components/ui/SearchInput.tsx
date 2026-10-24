import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  // The applied search (trimmed); "" = no search
  value: string;
  // Called with the trimmed text once typing pauses, or at once on clear
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}

// Search box of list pages. What the user types stays in this component's
// own state, so a keystroke re-renders only the input — not the page and
// its table. The page hears about the text only after `delay` ms of quiet.
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  delay = 300,
}: SearchInputProps) {
  const [text, setText] = useState(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Changed from outside (e.g. "Clear filters") → show it. Adjusted during
  // render, not in an effect, so there is no extra render with stale text.
  const [applied, setApplied] = useState(value);
  if (applied !== value) {
    setApplied(value);
    if (text.trim() !== value) setText(value);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === value) return;
    const timer = setTimeout(() => onChangeRef.current(next), delay);
    return () => clearTimeout(timer);
  }, [text, value, delay]);

  return (
    <Input
      allowClear
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      aria-label={placeholder}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        // The clear icon: apply right away, no reason to wait
        if (event.type !== "change") onChangeRef.current("");
      }}
      className={className}
    />
  );
}
