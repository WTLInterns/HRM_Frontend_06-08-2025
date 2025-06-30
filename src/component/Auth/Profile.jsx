import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";

const Profile = () => {
  const { user, logoutUser, fetchUserProfile } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    fetchUserProfile();
    console.log(user);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-700 to-blue-500 page-container">
        <div className="text-white text-lg animate-pulse">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10 page-container">
      <div className="container mx-auto max-w-5xl p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg transform transition duration-500 hover:shadow-2xl card">
          {/* Profile Header */}
          <div className="flex items-center justify-center flex-col mb-10">
            <div className="w-24 h-24 mb-4 overflow-hidden rounded-full border-4 border-purple-200 transform transition duration-500 hover:scale-105 hover:border-purple-300 hover:shadow-md">
              <img
                src="https://www.w3schools.com/howto/img_avatar.png"
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
            <h2 className="text-3xl font-semibold text-gray-800 mt-4 transform transition duration-300 hover:scale-105">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 text-lg transform transition duration-300 hover:text-indigo-600">{user.role}</p>
          </div>
          
          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm transform transition duration-300 hover:translate-y-[-5px] hover:shadow-md">
              <div className="flex items-center mb-3">
                <MdEmail className="text-indigo-600 text-xl mr-2 animate-float" />
                <h3 className="text-lg font-medium text-gray-700">Email</h3>
              </div>
              <p className="text-gray-700">{user.email}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm transform transition duration-300 hover:translate-y-[-5px] hover:shadow-md">
              <div className="flex items-center mb-3">
                <FaUser className="text-indigo-600 text-xl mr-2 animate-float" />
                <h3 className="text-lg font-medium text-gray-700">Phone</h3>
              </div>
              <p className="text-gray-700">{user.phone}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm transform transition duration-300 hover:translate-y-[-5px] hover:shadow-md">
              <div className="flex items-center mb-3">
                <HiOutlineUserGroup className="text-indigo-600 text-xl mr-2 animate-float" />
                <h3 className="text-lg font-medium text-gray-700">Role</h3>
              </div>
              <p className="text-gray-700">{user.role}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
            <button 
              onClick={() => navigate(-1)} 
              className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-sm transform transition duration-300 hover:translate-y-[-2px] hover:bg-gray-600 hover:shadow-md"
            >
              Back
            </button>
            <button 
              onClick={logoutUser} 
              className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-sm flex items-center justify-center transform transition duration-300 hover:translate-y-[-2px] hover:bg-red-600 hover:shadow-md"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
