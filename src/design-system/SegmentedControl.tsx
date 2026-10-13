export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="qp-segments" role="radiogroup" aria-label={label}>
      {label ? <span className="qp-segments__label">{label}</span> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            className="qp-segment"
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
