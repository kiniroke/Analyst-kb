import { useAuth } from "../context/AuthContext";

function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="card unauthorized-card">
        <h2>Access restricted</h2>
        <p>This section is available only for roles with administrative permissions.</p>
      </div>
    );
  }

  return children;
}

export default RoleGuard;
