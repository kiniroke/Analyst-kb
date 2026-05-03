import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-header">
      <div>
        <div className="page-title">Internal Operations Workspace</div>
        <div className="page-subtitle">
          Standardized workflows for source verification, case handling, and analyst coordination
        </div>
      </div>
      <div className="user-panel">
        <div>
          <div className="user-name">{user?.fullName}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button className="button button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
