import { Link, useNavigate } from "react-router-dom";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/Auth.css";
import { useToast } from "../utils/context/ToastContext";
import { useAuth } from "../utils/context/AuthContext";
import { useSignupMutation } from "../store/api/authApi";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/slices/authSlice";

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { setUser } = useAuth();
  const [signup] = useSignupMutation();

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "confirmPassword") setConfirmPassword(value);

    if (type === "checkbox" && "checked" in e.target) {
      const checked = e.target.checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.email.trim()) return "Email is required";
    if (!emailRegex.test(form.email.trim()))
      return "Enter a valid email address";

    if (!form.password) return "Password is required";
    if (form.password.length < 8)
      return "Password must be at least 8 characters";
    if (form.password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Signup form submitted with data:", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: "***",
    });

    const validationMessage = validate();
    if (validationMessage) {
      console.log("Validation failed:", validationMessage);
      return addToast({ message: validationMessage, type: "error" });
    }

    try {
      setIsSubmitting(true);
      console.log("Calling signup API...");

      // Call the backend API
      const result = await signup({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      }).unwrap();

      console.log("Signup API response:", result);

      if (result.status === "success") {
        console.log("Signup successful");
        addToast({
          message:
            result.message ||
            "Account created successfully! Please wait for admin approval.",
          type: "success",
        });

        // If user is auto-approved (admin), store the token and user data
        if (result.user && result.token) {
          dispatch(loginSuccess({ user: result.user, token: result.token }));
          setUser(result.user);

          // they are directed to login page
          setTimeout(() => navigate("/login"), 2000);
        } else {
          // User needs approval, redirect to login
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        console.log(
          "Signup failed with status:",
          result.status,
          "message:",
          result.message,
        );
        addToast({
          message: result.message || "Unable to sign up. Please try again.",
          type: "error",
        });
      }
    } catch (err: any) {
      console.log("Signup error:", err);
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Unable to sign up. Please try again.";
      addToast({ message: errorMessage, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* Left: Form */}
      <div className="px-6 py-10 lg:px-16 flex items-center">
        <div className="w-full max-w-xl mx-auto">
          <div className="absolute top-0 left-0 w-20 h-20 md:w-60 md:h-60 rounded-full bg-main translate-x-[-55%] translate-y-[-55%]"></div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-Montserrat">
            Join Build Today
          </h1>
          <p className="text-slate-500 mt-2 font-poppins">
            Start building a smarter school environment.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  placeholder="John"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  placeholder="Doe"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 translate-y-1/4 md:block"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 translate-y-1/4 md:block"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full inline-flex items-center justify-center rounded-md text-white px-4 py-2.5 font-medium ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"}`}
            >
              {isSubmitting ? "Creating..." : "Create account"}
            </button>

            <p className="text-sm text-slate-600 font-bold">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-sky-700 font-medium hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right: Illustration / marketing panel */}
      <div className="hidden lg:flex flex-col items-center bg-main text-white overflow-hidden">
        <div className="relative flex items-center justify-center h-96 w-96 -mb-40 mt-14 -translate-x-6">
          <div className="absolute z-0 h-60 w-60 rounded-full bg-[#051858]"></div>
          <img
            src="images/side-auth-bg.png"
            alt="Illustration"
            className="relative z-10"
          />
        </div>
        <div className="p-12 flex flex-col justify-center pt-60 relative">
          <h2 className="text-2xl md:text-3xl font-bold w-full -translate-x-6">
            Smart attendance management system
          </h2>
          <p className="mt-4 w-full max-w-md text-sky-100/90 text-md">
            Build is a smart, role-based school attendance system that helps
            administrators, teachers, discipline staff, and nurses track and
            manage attendance with ease.
          </p>

          <div className="mt-10">
            <div className="mt-6 flex gap-2 justify-center">
              {[
                "images/hollow-Ellipse 3.png",
                "images/hollow-Group 18.png",
                "images/hollow-Ellipse 3.png",
              ].map((item, index) => (
                <img key={index} src={item} alt="" className="h-2/5 w-2" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile phone and girl */}
      <div className="bottom-[11%] left-[50%] translate-x-[-50%] h-20 w-20 z-30 absolute hidden lg:block">
        <img src="images/mobile.png" alt="mobile phone" className="" />
        <img
          src="images/girl.png"
          alt=""
          className="-translate-y-[100%] translate-x-12 h-15 w-6"
        />
      </div>

      {/* Bubble effects */}
      <div className="bottom-[70%] left-[40%] translate-x-[-50%] absolute hidden">
        <img
          src="images/Ellipse 13.png"
          alt=""
          className="translate-x-[-80%] translate-y-[20%]"
        />
        <img
          src="images/Ellipse 12.png"
          alt=""
          className="translate-x-[-160%] translate-y-[60%]"
        />
        <img
          src="images/Ellipse 11.png"
          alt=""
          className="translate-x-[-240%] translate-y-[80%]"
        />
      </div>
    </div>
  );
}

export default Signup;
