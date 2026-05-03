function TextInput({ label, textarea = false, className = "", ...props }) {
  const Element = textarea ? "textarea" : "input";

  return (
    <label className={`form-field ${className}`.trim()}>
      <span>{label}</span>
      <Element {...props} />
    </label>
  );
}

export default TextInput;
