import { FaExclamationTriangle, FaUserShield } from "react-icons/fa";
import { useAuth } from "../../utils/context/AuthContext";

const NoApprovalView = () => {
    const { user } = useAuth();
    if (!user) return null;

    const firstname = user.first_name ?? "Unknown";
    const lastname = user.last_name ?? "";
    const role = (user.role ?? "user").toUpperCase();

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <div className="border-2 border-red-300 bg-white shadow-lg w-full max-w-md p-6 rounded-xl flex flex-col items-center text-center">
                {/* Icon */}
                <FaExclamationTriangle className="text-red-500 text-5xl mb-4 animate-pulse" />

                {/* User Info */}
                <div className="flex items-center mb-2">
                    <FaUserShield className="text-main text-2xl mr-2" />
                    <span className="text-main text-xl font-bold">{role}</span>
                    <span className="text-main text-xl font-semibold ml-2">{firstname} {lastname}</span>
                </div>

                {/* Message */}
                <p className="text-gray-700 text-sm mt-4">
                    Your account is currently <span className="font-semibold text-red-500">pending approval</span>. <br />
                    Please wait for the admin to approve your access and assign you a role before using the system.
                </p>
            </div>
        </div>
    );
}

export default NoApprovalView;
