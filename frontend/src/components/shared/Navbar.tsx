import routesConfig from "../../routes.config";
import { BiLogOut } from "react-icons/bi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../utils/context/ToastContext";
import { useAuth } from "../../utils/context/AuthContext";
import Role, { STORAGE_KEYS, MANAGEMENT_SUBTABS } from "../../utils/constants";
import { useState, useEffect } from "react";

export interface INavbarActive {
  active: string;
  setActive: (active: string) => void;
}

function Navbar({ active, setActive }: INavbarActive) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const role = user?.role;

  const [managementOpen, setManagementOpen] = useState(false);
  const [selectedSubtab, setSelectedSubtab] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.MANAGEMENT_SUBTAB) || MANAGEMENT_SUBTABS.INTAKE;
  });

  // Open/close management dropdown based on active tab
  useEffect(() => {
    const managementSubtabs = ['Students', 'Intake', 'Classes', 'Courses'];
    if (active === 'Management' || managementSubtabs.includes(active)) {
      setManagementOpen(true);
    } else {
      setManagementOpen(false);
    }
  }, [active]);

  // Filter visible items - ensure we have a valid role before filtering
  const visibleItems = routesConfig.filter(
    (route) => {
      // Always show items with Role.ALL
      if (route.allowedRoles.includes(Role.ALL)) {
        return true;
      }
      // Only filter by role if we have a valid role
      if (role && role !== 'inactive') {
        return route.allowedRoles.includes(role);
      }
      // If no role yet, don't show role-specific items
      return false;
    }
  );

  const handleManagementClick = () => {
    if (!managementOpen) {
      // When clicking Management, always go to the last selected subtab
      setManagementOpen(true);
      setActive(selectedSubtab);
    } else {
      // When closing, just close the dropdown but keep the current active subtab
      setManagementOpen(false);
    }
  };

  const handleSubtabClick = (subtab: string) => {
    setSelectedSubtab(subtab);
    setActive(subtab);
    localStorage.setItem(STORAGE_KEYS.MANAGEMENT_SUBTAB, subtab);
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout of the system")) return;

    try {
      await logout();
      // Navigate immediately and replace history to avoid going back
      navigate("/login", { replace: true });
      addToast({ title: "Logged out", message: "You have been logged out", type: "success" });
    } catch (error) {
      addToast({ title: "Error", message: "Failed to logout", type: "error" });
    }
  };

  return (
    <div className="w-56 flex flex-col min-h-screen bg-main text-white">
      <div className="p-4 flex items-center gap-5 my-4">
        <img src="logo.png" alt="Build Logo" className="h-12 w-12" />
        <span className="ml-2 font-poppins font-semibold text-xl">Build</span>
      </div>

      {visibleItems.map((item) => (
        <div key={item.menu}>
          {/* Main menu item */}
          <div
            className={`p-4 px-10 flex items-center gap-3 cursor-pointer font-poppins font-bold transition-colors ${item.hasDropdown
              ? (['Students', 'Intake', 'Classes', 'Courses'].includes(active)
                ? "bg-white/20 text-white"
                : "hover:bg-white/10")
              : (active === item.menu
                ? "bg-white text-main"
                : "hover:bg-white/10")
              }`}
            onClick={() => item.hasDropdown ? handleManagementClick() : setActive(item.menu)}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[0.85rem] leading-[1rem] flex-1">
              {
                (role === "teacher" && item.menu == 'Classes')
                  ? "My Classes"
                  : item.menu
              }
            </span>
            {item.hasDropdown && (
              <span className="text-sm">
                {managementOpen ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            )}
          </div>

          {/* Dropdown subtabs */}
          {item.hasDropdown && managementOpen && (
            <div className="bg-white/5">
              {item.subtabs?.map((subtab) => (
                <div
                  key={subtab.menu}
                  className={`p-3 px-16 flex items-center gap-3 cursor-pointer font-poppins transition-colors ${active === subtab.menu
                    ? "bg-white text-main"
                    : "hover:bg-white/10 text-white/90"
                    }`}
                  onClick={() => handleSubtabClick(subtab.menu)}
                >
                  <span className="text-base">{subtab.icon}</span>
                  <span className="text-[0.8rem] leading-[.5rem]">
                    {subtab.menu === 'Classes' ? 'Classes' : subtab.menu}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="mt-auto mb-6">
        <div
          className="p-4 px-10 flex items-center gap-3 cursor-pointer font-poppins font-bold transition-colors bg-white/10 hover:bg-white/20 rounded-lg mx-4"
          onClick={handleLogout}
        >
          <span className="text-lg">
            <BiLogOut />
          </span>
          <span className="text-white text-sm">Logout</span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
