import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const NavBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logout successfully");
    navigate("/login", { state: { fromLogout: true } });
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default NavBar; 