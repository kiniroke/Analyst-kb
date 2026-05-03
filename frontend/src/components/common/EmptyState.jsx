function EmptyState({ title = "No data", description = "Nothing to show yet." }) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      <p className="muted-text">{description}</p>
    </div>
  );
}

export default EmptyState;
