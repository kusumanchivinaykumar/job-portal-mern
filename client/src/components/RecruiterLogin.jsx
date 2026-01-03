import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RecruiterLogin = () => {
  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);
  const [isTextDataSubmitted, setIsTextDataSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setShowRecruiterLogin, setRecruiter } = useContext(AppContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Step 1 of signup (text data)
    if (state === "Sign Up" && !isTextDataSubmitted) {
      if (!name || !email || !password) {
        setErrorMsg("All fields are required");
        return;
      }
      setIsTextDataSubmitted(true);
      return;
    }

    try {
      setLoading(true);

      // ================= SIGN UP =================
      if (state === "Sign Up") {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        if (image) formData.append("image", image);

        const { data } = await axios.post("/api/company/register", formData);

        if (!data.success) {
          setErrorMsg(data.message || "Signup failed");
          setLoading(false);
          return;
        }

        // ✅ SAVE TOKEN
        localStorage.setItem("recruiterToken", data.token);
        localStorage.setItem("recruiterInfo", JSON.stringify(data.company));

        setRecruiter(data.company);
        setShowRecruiterLogin(false);
        navigate('/dashboard/manage-jobs');
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard/manage-jobs') {
            window.location.href = '/dashboard/manage-jobs';
          }
        }, 100);
      }

      // ================= LOGIN =================
      if (state === "Login") {
        const { data } = await axios.post("/api/company/login", { email, password });

        if (!data.success) {
          setErrorMsg(data.message || "Invalid email or password");
          setLoading(false);
          return;
        }

        // ✅ SAVE TOKEN
        localStorage.setItem("recruiterToken", data.token);
        localStorage.setItem("recruiterInfo", JSON.stringify(data.company));

        setRecruiter(data.company);
        setShowRecruiterLogin(false);
        navigate('/dashboard/manage-jobs');
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard/manage-jobs') {
            window.location.href = '/dashboard/manage-jobs';
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <form
        onSubmit={onSubmitHandler}
        className="relative bg-white p-10 rounded-xl text-slate-500 w-[350px]"
      >
        <h1 className="text-center text-2xl text-neutral-700 font-medium">
          Recruiter {state}
        </h1>

        <p className="text-sm mb-3">
          {state === "Login"
            ? "Welcome back! Please sign in to continue"
            : "Create your recruiter account"}
        </p>

        {errorMsg && (
          <p className="text-red-600 text-sm mb-2">{errorMsg}</p>
        )}

        {/* IMAGE UPLOAD STEP */}
        {state === "Sign Up" && isTextDataSubmitted ? (
          <div className="flex items-center gap-4 my-5">
            <label htmlFor="image">
              <img
                className="w-16 rounded-full cursor-pointer"
                src={image ? URL.createObjectURL(image) : assets.upload_area}
                alt="Upload"
              />
              <input
                type="file"
                id="image"
                hidden
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <p>
              Upload Company <br /> Logo
            </p>
          </div>
        ) : (
          <>
            {state === "Sign Up" && (
              <div className="border px-4 py-2 flex items-center gap-2 rounded-full mt-3">
                <img src={assets.person_icon} alt="" />
                <input
                  className="outline-none text-sm w-full"
                  type="text"
                  placeholder="Company Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="border px-4 py-2 flex items-center gap-2 rounded-full mt-3">
              <img src={assets.email_icon} alt="" />
              <input
                className="outline-none text-sm w-full"
                type="email"
                placeholder="Email Id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="border px-4 py-2 flex items-center gap-2 rounded-full mt-3">
              <img src={assets.lock_icon} alt="" />
              <input
                className="outline-none text-sm w-full"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {state === "Login" && (
          <p className="text-sm text-blue-600 my-2 cursor-pointer">
            Forgot Password?
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-full w-full mt-4 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : state === "Login"
            ? "Login"
            : isTextDataSubmitted
            ? "Create Account"
            : "Next"}
        </button>

        <p className="mt-4 text-center text-sm">
          {state === "Login" ? (
            <>
              Don&apos;t have an account?{" "}
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => {
                  setState("Sign Up");
                  setIsTextDataSubmitted(false);
                }}
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => {
                  setState("Login");
                  setIsTextDataSubmitted(false);
                }}
              >
                Login
              </span>
            </>
          )}
        </p>

        <img
          onClick={() => setShowRecruiterLogin(false)}
          className="absolute top-5 right-5 cursor-pointer"
          src={assets.cross_icon}
          alt="Close"
        />
      </form>
    </div>
  );
};

export default RecruiterLogin;
