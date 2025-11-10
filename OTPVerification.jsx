// src/components/OTPVerification.jsx
import React, { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

const OTPVerification = ({ onVerify, onPrevious, loading, error, success }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify({ otp });
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-center text-sm text-gray-600 mb-4">
        An OTP has been sent to your email/phone. Please enter it below.
      </p>
      <div className="mb-4">
        <label className="block text-gray-700 mb-1" htmlFor="otp">
          OTP
        </label>
        <input
          type="text"
          id="otp"
          name="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-3 py-2 text-center text-lg border rounded-md tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading && (
        <div className="text-center text-indigo-500 flex items-center justify-center space-x-2 mb-4">
          <FaSpinner className="animate-spin" />
          <span>Verifying...</span>
        </div>
      )}
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-300"
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center"
        >
          {loading ? <FaSpinner className="animate-spin" /> : 'Verify & Register'}
        </button>
      </div>
    </form>
  );
};

export default OTPVerification;
