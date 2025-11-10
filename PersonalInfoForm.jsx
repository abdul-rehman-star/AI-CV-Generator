// src/components/PersonalInfoForm.jsx
import React, { useState } from 'react';

const PersonalInfoForm = ({ onNext, initialData }) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };
    setData(newData);
    onNext(newData, false); // keep data in parent
  };

  const validate = () => {
    let newErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.password) newErrors.password = 'Password is required';
    if (data.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (data.password !== data.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext(data, true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 mb-1" htmlFor="name">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="John Doe"
          value={data.name}
          onChange={handleChange}
          className="input-field"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-1" htmlFor="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Create a strong password"
          value={data.password}
          onChange={handleChange}
          className="input-field"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 mb-1" htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={data.confirmPassword}
          onChange={handleChange}
          className="input-field"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      <button type="submit" className="btn-primary">Next</button>
    </form>
  );
};

export default PersonalInfoForm;
