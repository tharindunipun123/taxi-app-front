import React from "react";
import "./Navbar.css";
import logo from '../../assets/logo1.png';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  return (
    <header className="navbar">
      <button
        className={`menu-btn ${isSidebarOpen ? "move-right" : ""}`}
        onClick={toggleSidebar}
      >
        ☰
      </button>
      
    </header>
  );
};

export default Navbar;

