import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/sources", label: "Sources" },
  { to: "/social-accounts", label: "Social Accounts" },
  { to: "/cases", label: "Cases" },
  { to: "/tasks", label: "Tasks" },
  { to: "/knowledge-base", label: "Knowledge Base" },
  { to: "/case-assistant", label: "Case Assistant" },
  { to: "/reports", label: "Reports" },
  { to: "/api-docs", label: "API Docs" },
  { to: "/about", label: "About Project" },
];

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-eyebrow">CSI Strategic consulting & IT</div>
        <div className="brand-title">Analyst Operations Hub</div>
        <div className="brand-subtitle">Internal analyst workflow platform</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
        {user?.role === "ADMIN" ? (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Admin Panel
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
}

export default Sidebar;
