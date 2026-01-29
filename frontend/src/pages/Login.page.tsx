import { Link, useNavigate } from "react-router-dom";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useToast } from "../utils/context/ToastContext";
import { useAuth } from "../utils/context/AuthContext";
import { useLoginMutation } from "../store/api/authApi";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/slices/authSlice";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { setUser } = useAuth();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const navigate = useNavigate();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    return null;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validate();
    if (validation) return addToast({ message: validation, type: "error" });

    try {
      setIsSubmitting(true);

      // Call the backend API
      const result = await login({
        email: form.email.trim(),
        password: form.password,
      }).unwrap();

      if (result.status === 'success' && result.user && result.token) {
        // Extract primary role from roles array
        const primaryRole = result.roles && result.roles.length > 0 ? result.roles[0].name : 'inactive';

        // Update user object with role name
        const userWithRole = {
          ...result.user,
          role: primaryRole,
          role_id: result.roles && result.roles.length > 0 ? result.roles[0].id : ''
        };

        // Store token and user data in Redux
        dispatch(loginSuccess({ user: userWithRole, token: result.token }));
        setUser(userWithRole);

        // Check if user is inactive (pending approval)
        if (primaryRole === 'inactive') {
          addToast({
            message: "Login successful. Your account is pending admin approval.",
            type: "warning"
          });
        } else {
          addToast({ message: "Login successful", type: "success" });
        }

        // Wait a bit to ensure token is properly stored
        setTimeout(() => navigate("/"), 500);
      } else {
        addToast({
          message: result.message || "Invalid credentials. Please check your email and password.",
          type: "error",
        });
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || "Invalid credentials. Please check your email and password.";
      addToast({ message: errorMessage, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* Left: Illustration / marketing panel */}
      <div className="hidden lg:flex flex-col items-center bg-main text-white overflow-hidden">
        <div className="relative flex items-center justify-center h-96 w-96 -mb-40 mt-14 -translate-x-6">
          <div className="absolute z-0 h-60 w-60 rounded-full bg-[#051858]"></div>
          <img src="/images/side-auth-bg.png" alt="Illustration" className="relative z-10" />
        </div>
        <div className="p-12 flex flex-col justify-center pt-60 relative">
          <h2 className="text-2xl md:text-3xl font-bold w-full -translate-x-6">
            Smart attendance management system
          </h2>
          <p className="mt-4 w-full max-w-md text-sky-100/90 text-md">
            Build is a smart, role-based school attendance system that helps administrators, teachers,
            discipline staff, and nurses track and manage attendance with ease.
          </p>
          <div className="mt-10">
            <div className="mt-6 flex gap-2 justify-center">
              {[
                "/images/hollow-Ellipse-3.png",
                "/images/hollow-Group-18.png",
                "/images/hollow-Ellipse-3.png",
              ].map((item, index) => (
                <img key={index} src={item} alt="" className="h-2/5 w-2" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="px-6 py-10 lg:px-16 flex items-center">
        <div className="w-full max-w-xl mx-auto">
          <div className="absolute top-0 left-0 w-20 h-20 md:w-60 md:h-60 rounded-full bg-main translate-x-[-55%] translate-y-[-55%]"></div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-Montserrat">
            Login to Build
          </h1>
          <p className="text-slate-500 mt-2 font-poppins">Welcome back to Build, the smart school platform</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email or phone number
              </label>
              <input
                type="text"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 translate-y-1/4 hidden md:block"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={onChange}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full inline-flex items-center justify-center rounded-md text-white px-4 py-2.5 font-medium transition-all duration-150 ${isSubmitting
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
                }`}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>


            <p className="text-sm text-slate-600 mt-4 font-bold">
              Don't have an account?{" "}
              <Link to="/signup" className="text-sky-700 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Floating mobile & girl images */}
      <div className="bottom-[11%] left-[50%] translate-x-[-50%] h-20 w-20 z-30 absolute hidden lg:block">
        <img src="/images/mobile.png" alt="mobile phone" />
        <img src="/images/girl.png" alt="" className="-translate-y-[100%] translate-x-12 h-15 w-6" />
      </div>

      {/* Bubble effects */}
      <div className="bottom-[70%] right-[10%] translate-x-[-50%] absolute">
        <img src="/images/Ellipse 13.png" alt="" className="translate-x-[-80%] translate-y-[20%]" />
        <img src="/images/Ellipse 12.png" alt="" className="translate-x-[-160%] translate-y-[60%]" />
        <img src="/images/Ellipse 11.png" alt="" className="translate-x-[-240%] translate-y-[80%]" />
      </div>
    </div>
  );
}
