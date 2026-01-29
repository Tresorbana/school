import { useEffect, useState } from "react";
import { useAuth } from "../../utils/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AvatarLetter from "../shared/AvatarLetter";
import ViewHeader from "../shared/ViewHeader";
import { useToast } from "../../utils/context/ToastContext";
import { userService } from "../../services/userService";
import SharedHeader from "../shared/SharedHeader";

export type ProfileState = {
  id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  password: string;
};

function SettingsView() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    id: user?.id ?? null,
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    role: (user as any)?.role ?? "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);

        const response = await userService.getCurrentUser();

        if (response.status === 'success') {
          const userData = response.user; // Backend returns user data in 'user' property
          setProfile((prev) => ({
            ...prev,
            id: userData.id ?? prev.id,
            first_name: userData.first_name ?? prev.first_name,
            last_name: userData.last_name ?? prev.last_name,
            email: userData.email ?? prev.email,
            role: userData.roles?.[0]?.name ?? prev.role,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        addToast({ message: "Failed to load profile data", type: "error" });
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user?.id) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run when user.id changes

  const handleEdit = async () => {
    try {
      setLoadingProfile(true);

      // Validate required fields
      if (!profile.first_name.trim() || !profile.last_name.trim() || !profile.email.trim()) {
        addToast({ message: "First name, last name, and email are required", type: "error" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email.trim())) {
        addToast({ message: "Please enter a valid email address", type: "error" });
        return;
      }

      // Prepare update data
      const updateData: any = {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        email: profile.email.trim(),
      };

      // Only include password if it's provided and has minimum length
      if (profile.password.trim()) {
        if (profile.password.length < 6) {
          addToast({ message: "Password must be at least 6 characters long", type: "error" });
          return;
        }
        updateData.password = profile.password;
      }

      const response = await userService.updateCurrentUser(updateData);

      if (response.status === 'success') {
        // Update the auth context with new user data
        const updatedUser = {
          ...user!,
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email.trim(),
        };

        // console.log('Current user before update:', user);
        // console.log('Updated user data:', updatedUser);

        // Update Redux state and localStorage
        setUser(updatedUser);

        // Verify localStorage was updated
        // setTimeout(() => {
        //   const storedData = localStorage.getItem('userData');
        //   console.log('localStorage after update:', storedData ? JSON.parse(storedData) : null);
        // }, 100);

        // Clear password field for security
        setProfile((prev) => ({ ...prev, password: "" }));

        addToast({ message: "Profile updated successfully", type: "success" });
      } else {
        addToast({ message: response.message || "Failed to update profile", type: "error" });
      }
    } catch (error: any) {
      console.error("Profile update error:", error);

      // Handle specific error cases
      let errorMessage = "Failed to update profile";

      if (error?.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid data provided";
      } else if (error?.response?.status === 401) {
        errorMessage = "Session expired. Please log in again";
        // Optionally redirect to login
        // logout();
      } else if (error?.response?.status === 409) {
        errorMessage = "Email address is already in use";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      addToast({ message: errorMessage, type: "error" });
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="font-poppins">
      {user?.role === 'inactive' && (
        <div className="mb-6 mt-2 mx-5 p-2 bg-main/20 border-l-4 border-main text-main rounded shadow flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-[.8rem] md:text-sm">
            Your account is <strong>pending approval</strong>. Some features may be restricted until an admin approves your account and give you a role.
          </p>
        </div>
      )}

      {user?.role !== 'inactive' && (
        <SharedHeader placeholder="Search anything" />
      )}

      <div className="m-10">
        <ViewHeader title="Settings" />

        <div className="bg-white border-2 border-gray-200 p-6 rounded-lg mt-7">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <AvatarLetter
                firstname={profile.first_name}
                lastname={profile.last_name}
                email={profile.email}
                size={80}
              />
              <div>
                <h3 className="text-gray-800 font-semibold">
                  {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-gray-500 text-[.8rem]">{profile.email}</p>
              </div>
            </div>

            <button
              type="submit"
              form="profile-form"
              className={`text-[.8rem] text-white px-4 py-2 rounded-md ${loadingProfile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-main hover:bg-main/90'
                }`}
              disabled={loadingProfile}
            >
              {loadingProfile ? 'Updating...' : 'Edit'}
            </button>
          </div>

          <form
            id="profile-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="grid grid-cols-1 gap-6 mt-8"
          >
            <div>
              <label className="block text-[.8rem] text-gray-600 mb-2">First Name</label>
              <input
                className="w-full text-[.8rem] border border-gray-200 rounded-md px-3 py-2 focus:outline-blue-900"
                placeholder="Your First Name"
                value={profile.first_name}
                onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                disabled={loadingProfile}
              />
            </div>

            <div>
              <label className="block text-[.8rem] text-gray-600 mb-2">Last Name</label>
              <input
                className="w-full text-[.8rem] border border-gray-200 rounded-md px-3 py-2 focus:outline-blue-900"
                placeholder="Your Last Name"
                value={profile.last_name}
                onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                disabled={loadingProfile}
              />
            </div>

            <div>
              <label className="block text-[.8rem] text-gray-600 mb-2">Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-md text-[.8rem] px-3 py-2 focus:outline-blue-900"
                placeholder="Your Email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                disabled={loadingProfile}
              />
            </div>

            <div className="relative">
              <label className="block text-[.8rem] text-gray-600 mb-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-200 text-[.8rem] rounded-md px-3 py-2 focus:outline-main placeholder:text-gray-400 placeholder:text-[.8rem]"
                placeholder="Leave empty to keep current password"
                value={profile.password}
                onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))}
                disabled={loadingProfile}
              />
              <button
                type="button"
                className="absolute text-[.8rem] right-3 top-1/2 translate-y-1/4 md:block"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loadingProfile}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
