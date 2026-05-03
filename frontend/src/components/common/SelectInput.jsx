function SelectInput({ label, options = [], className = "", ...props }) {
  return (
    <label className={`form-field ${className}`.trim()}>
      <span>{label}</span>
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SelectInput;
