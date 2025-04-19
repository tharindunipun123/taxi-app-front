import React from "react";
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom"; // Add this import
import { FaTachometerAlt, FaUsers, FaTaxi, FaMapMarkedAlt, FaCar, FaMoneyBillWave } from 'react-icons/fa';
import taxilogo from '../../assets/taxilogo.png';

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // Add this to track current route
  
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="logo">
        <img
          src={taxilogo}
          alt="User"
          className="logo"
        />
      </div>
      <nav>
        <ul>
          <li className={location.pathname === "/" ? "active" : ""}>
            <Link to="/">
              <FaTachometerAlt /> <span>Dashboard</span>
            </Link>
          </li>
          <li className={location.pathname === "/customers" ? "active" : ""}>
            <Link to="/customers">
              <FaUsers /> <span>Customers</span>
            </Link>
          </li>
          <li className={location.pathname === "/drivers" ? "active" : ""}>
            <Link to="/drivers">
              <FaTaxi /> <span>Drivers</span>
            </Link>
          </li>
          <li className={location.pathname === "/hires" ? "active" : ""}>
            <Link to="/hires">
              <FaMapMarkedAlt /> <span>Hires</span>
            </Link>
          </li>
          <li className={location.pathname === "/vehicles" ? "active" : ""}>
            <Link to="/vehicles">
              <FaCar /> <span>Vehicles</span>
            </Link>
          </li>
          <li className={location.pathname === "/payments" ? "active" : ""}>
            <Link to="/payments">
              <FaMoneyBillWave /> <span>Payments</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;