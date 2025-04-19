import React, { useState } from 'react';
import './Animal.css';
import { FaChevronDown } from 'react-icons/fa';

const DriverApp = () => {
  // Sample driver applications data
  const [driverApplications, setDriverApplications] = useState([
    {
      id: 1,
      name: 'Michael Smith',
      email: 'michael@example.com',
      licenseNo: 'DL-123456',
      vehicle: 'Toyota Camry',
      experience: '3 years',
      status: 'Pending',
      avatar: 'https://i.pravatar.cc/100?img=3'
    }
  ]);

  // State for dropdown selectors
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  
  // Sample customers for dropdown
  const customers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Sarah Wilson' },
    { id: 3, name: 'Robert Johnson' }
  ];
  
  // Sample drivers for dropdown
  const drivers = [
    { id: 1, name: 'Michael Smith' },
    { id: 2, name: 'David Brown' },
    { id: 3, name: 'Lisa Garcia' }
  ];

  // Handle approve application
  const handleApprove = (id) => {
    const updatedApplications = driverApplications.map(app => 
      app.id === id ? { ...app, status: 'Approved' } : app
    );
    setDriverApplications(updatedApplications);
  };

  // Handle reject application
  const handleReject = (id) => {
    const updatedApplications = driverApplications.map(app => 
      app.id === id ? { ...app, status: 'Rejected' } : app
    );
    setDriverApplications(updatedApplications);
  };

  // Handle assign driver
  const handleAssignDriver = () => {
    console.log(`Assigning driver: ${selectedDriver} to customer: ${selectedCustomer}`);
    // In a real app, this would make an API call
    
    // Reset form after submission
    setSelectedCustomer('');
    setSelectedDriver('');
  };

  return (
    <div className="driver-app-container">
      {/* Driver Applications Section */}
      <div className="driver-applications-section">
        <h1>Driver Applications</h1>
        
        <div className="app-table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License No</th>
                <th>Vehicle</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {driverApplications.map(app => (
                <tr key={app.id}>
                  <td className="driver-name-cell">
                    <img src={app.avatar} alt={app.name} className="driver-avatar" />
                    <div className="driver-info">
                      <div className="name">{app.name}</div>
                      <div className="email">{app.email}</div>
                    </div>
                  </td>
                  <td>{app.licenseNo}</td>
                  <td>{app.vehicle}</td>
                  <td>{app.experience}</td>
                  <td>
                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {app.status === 'Pending' && (
                      <>
                        <button 
                          className="btn-approve" 
                          onClick={() => handleApprove(app.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-reject" 
                          onClick={() => handleReject(app.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Driver Section */}
      <div className="assign-driver-section">
        <h2>Assign Driver to Customer</h2>
        
        <div className="assign-form">
          <div className="form-group">
            <label>Select Customer</label>
            <div className="custom-select">
              <select 
                value={selectedCustomer} 
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="select-arrow" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Select Driver</label>
            <div className="custom-select">
              <select 
                value={selectedDriver} 
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">Select a driver...</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="select-arrow" />
            </div>
          </div>
          
          <button 
            className="btn-assign" 
            onClick={handleAssignDriver}
            disabled={!selectedCustomer || !selectedDriver}
          >
            Assign Driver
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverApp;