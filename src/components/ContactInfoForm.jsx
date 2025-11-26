// src/components/ContactInfoForm.jsx
import React, { useState } from 'react';

const ContactInfoForm = ({ onNext, onPrevious, initialData }) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };
    setData(newData);
    onNext(newData, false); // keep synced
  };

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,15}$/;

    if (!data.email.trim() || !emailRegex.test(data.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!data.phone.trim() || !phoneRegex.test(data.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      window.appToast && window.appToast('OTP has been sent to your email/phone. (demo: 123456)', 'success');
      onNext(data, true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 mb-1" htmlFor="email">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={handleChange}
          className="input-field"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 mb-1" htmlFor="phone">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="03001234567"
          value={data.phone}
          onChange={handleChange}
          className="input-field"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>
      <div className="flex justify-between gap-3">
        <button type="button" onClick={onPrevious} className="btn-secondary">
          Previous
        </button>
        <button type="submit" className="btn-primary w-auto px-6">
          Send OTP
        </button>
      </div>
    </form>
  );
};

export default ContactInfoForm;
