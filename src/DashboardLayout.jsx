import React, { useState } from "react";
import Navbar from "./Components/Navbar/Navbar";
import Sidebar from "./Components/Sidebar/Sidebar";

const DashboardLayout = ({ children }) => {  // Add children prop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} />
      <div className="main-content" style={{ marginLeft: isSidebarOpen ? '220px' : '0', transition: 'margin-left 0.3s ease-in-out', padding: '20px', marginTop: '60px' }}>
        {children}  {/* Render the children here */}
      </div>
    </div>
  );
};

export default DashboardLayout;