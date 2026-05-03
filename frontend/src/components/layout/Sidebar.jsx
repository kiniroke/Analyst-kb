import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const items = [
  ["Dashboard", "/dashboard"],
  ["Source Registry", "/sources"],
  ["Extraction Lab", "/extraction-lab"],
  ["CSI Data Import", "/csi-data-import"],
  ["Coverage Checks", "/coverage-checks"],
  ["Issues", "/issues"],
  ["Tasks", "/tasks"],
  ["Knowledge Base", "/knowledge-base"],
  ["Reports", "/reports"],
  ["API Docs", "/api-docs"],
  ["About", "/about"],
];

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-kicker">CSI Strategic consulting & IT</div>
        <div className="brand-title">Parser Coverage Validator</div>
        <div className="brand-subtitle">Internal parser QA and CSI coverage validation</div>
      </div>

      <nav className="sidebar-nav">
        {items.map(([label, to]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            {label}
          </NavLink>
        ))}
        {user?.role === "ADMIN" ? (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Admin Panel
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
}

export default Sidebar;
