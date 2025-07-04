import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';
import LanguageToggle from "../../components/LanguageToggle";

const SignUp = () => {
  const { saveUser } = useApp();
  const { t } = useTranslation();
  const [firstName, setFname] = useState("");
  const [lastName, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const role = "EMPLOYEE";

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      const userData = { firstName, lastName, email, phone, password, role };
      await saveUser(userData);
      setSuccess(t('messages.employeeAddedSuccessfully'));
      toast.success(t('auth.registeredSuccessfully'));
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(t('auth.emailAlreadyExists'));
      } else {
        setError(t('auth.failedToRegister'));
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 page-container relative">
      {/* Language Toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle position="right" />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md transform transition duration-500 hover:shadow-2xl card">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-800 transition-all duration-300 hover:scale-105">{t('auth.signUp')}</h2>
        {error && <p className="text-red-500 text-center animate-pulse">{error}</p>}
        {success && <p className="text-green-500 text-center animate-pulse">{success}</p>}
        <form className="space-y-4" onSubmit={handleSignUp}>
          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="fname"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.firstName')}
            </label>
            <input
              type="text"
              id="fname"
              value={firstName}
              onChange={(e) => setFname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.enterFirstName')}
              required
            />
          </div>

          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="lname"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.lastName')}
            </label>
            <input
              type="text"
              id="lname"
              value={lastName}
              onChange={(e) => setLname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.enterLastName')}
              required
            />
          </div>

          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.emailAddress')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.enterEmailAddress')}
              required
            />
          </div>

          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.phoneNumber')}
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.enterPhoneNumber')}
              required
            />
          </div>

          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.enterPassword')}
              required
            />
          </div>

          <div className="transform transition duration-300 hover:translate-y-[-2px]">
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 ease-in-out hover:border-indigo-300"
              placeholder={t('auth.confirmPassword')}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition duration-300 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px] relative overflow-hidden btn"
          >
            {t('auth.signUp')}
            <span className="absolute inset-0 bg-white opacity-20 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100"></span>
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 transform transition duration-300 hover:scale-105">
          {t('auth.alreadyHaveAccount')}{" "}
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 transition duration-300 hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
