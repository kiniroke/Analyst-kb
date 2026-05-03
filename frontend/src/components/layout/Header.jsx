import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="page-header">
      <div>
        <h1 className="page-header-title">Parser Coverage Validator</h1>
        <p className="muted-text">
          Compare source website extraction with CSI export or CSI API data using auditable evidence.
        </p>
      </div>
      <div className="header-user">
        <div>
          <div className="header-user-name">{user?.fullName}</div>
          <div className="muted-text">{user?.role}</div>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Header;
