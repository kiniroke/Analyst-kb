import { humanizeEnum } from "../helpers";

function Badge({ value, type = "status" }) {
  const normalized = String(value || "")
    .toLowerCase()
    .replaceAll("_", "-");

  return <span className={`badge badge-${type} badge-${normalized}`}>{humanizeEnum(value)}</span>;
}

export default Badge;
