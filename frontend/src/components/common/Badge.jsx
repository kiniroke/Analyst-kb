import { humanizeEnum } from "../../helpers";

function Badge({ value }) {
  const normalized = String(value || "")
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");

  return <span className={`badge badge-${normalized}`}>{humanizeEnum(value)}</span>;
}

export default Badge;
