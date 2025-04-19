import React, { useState, useEffect } from 'react';
import './Payments.css';
import { FaPlus, FaSearch, FaFilter, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

// API base URLs
const API_URL = 'http://145.223.21.62:8085/api/collections';
const COMMISSIONS_API = `${API_URL}/commitions/records`;
const DRIVERS_API = `${API_URL}/driver/records`;
const HIRES_API = `${API_URL}/hire/records`;

const Payments = () => {
  // State for data
  const [commissions, setCommissions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [hires, setHires] = useState([]);
  const [activeTab, setActiveTab] = useState('commissions');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for modals
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showAnnualFeeModal, setShowAnnualFeeModal] = useState(false);
  const [currentCommission, setCurrentCommission] = useState(null);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Fetch commissions (unpaid 10% from each completed hire)
  const fetchCommissions = async () => {
    try {
      const response = await fetch(`${COMMISSIONS_API}?sort=-created&expand=driverid`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setCommissions(data.items);
      return data.items;
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError('Failed to load commissions data.');
      return [];
    }
  };

  // Fetch drivers for annual fee management
  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${DRIVERS_API}?sort=name`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setDrivers(data.items);
      return data.items;
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers data.');
      return [];
    }
  };

  // Fetch completed hires
  const fetchCompletedHires = async () => {
    try {
      const response = await fetch(`${HIRES_API}?filter=(is_completed=true)&sort=-completed_at`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setHires(data.items);
      return data.items;
    } catch (err) {
      console.error('Error fetching hires:', err);
      setError('Failed to load completed hires data.');
      return [];
    }
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCommissions(),
          fetchDrivers(),
          fetchCompletedHires()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load payment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter commissions based on search term and status filter
  const filteredCommissions = commissions.filter(commission => {
    const driverName = commission.expand?.driverid?.name || '';
    const matchesSearch = 
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commission.hireid && commission.hireid.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'paid') return matchesSearch && commission.ispayed;
    if (statusFilter === 'unpaid') return matchesSearch && !commission.ispayed;
    
    return matchesSearch;
  });

  // Filter drivers based on search term and annual fee status
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'paid') return matchesSearch && driver.anuualfee_paid;
    if (statusFilter === 'unpaid') return matchesSearch && !driver.anuualfee_paid;
    
    return matchesSearch;
  });

  // Handle marking commission as paid
  const handleMarkCommissionPaid = async (id) => {
    try {
      const response = await fetch(`${COMMISSIONS_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ispayed: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update local state
      setCommissions(commissions.map(comm => 
        comm.id === id ? { ...comm, ispayed: true } : comm
      ));
      
      // Close modal if open
      setShowCommissionModal(false);
    } catch (err) {
      console.error('Error updating commission payment status:', err);
      alert(`Failed to update payment status: ${err.message}`);
    }
  };

  // Handle marking annual fee as paid
  const handleMarkAnnualFeePaid = async (id) => {
    try {
      const response = await fetch(`${DRIVERS_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anuualfee_paid: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update local state
      setDrivers(drivers.map(driver => 
        driver.id === id ? { ...driver, anuualfee_paid: true } : driver
      ));
      
      // Close modal if open
      setShowAnnualFeeModal(false);
    } catch (err) {
      console.error('Error updating annual fee payment status:', err);
      alert(`Failed to update annual fee status: ${err.message}`);
    }
  };

  // Handle adding a new commission record
  const handleAddCommission = async () => {
    const completedHires = hires.filter(hire => hire.is_completed && hire.driverid);
    
    // Find hires that don't have commission records yet
    const hiresWithoutCommission = completedHires.filter(hire => 
      !commissions.some(comm => comm.hireid === hire.id)
    );
    
    if (hiresWithoutCommission.length === 0) {
      alert('All completed hires already have commission records.');
      return;
    }
    
    try {
      let addedCount = 0;
      
      for (const hire of hiresWithoutCommission) {
        // Calculate 10% commission from a hypothetical base amount
        // In a real app, you would use the actual hire amount
        const baseAmount = 1000; // Placeholder value
        const commissionAmount = baseAmount * 0.1;
        
        const response = await fetch(COMMISSIONS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hireid: hire.id,
            driverid: hire.driverid,
            customer_id: hire.user_id,
            base_amount: baseAmount,
            commition: commissionAmount,
            ispayed: false
          })
        });
        
        if (response.ok) {
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        alert(`Added ${addedCount} new commission records.`);
        fetchCommissions(); // Refresh the list
      } else {
        alert('No new commission records were added.');
      }
    } catch (err) {
      console.error('Error adding commission records:', err);
      alert(`Failed to add commission records: ${err.message}`);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get driver name from commission
  const getDriverName = (commission) => {
    if (commission.expand && commission.expand.driverid) {
      return commission.expand.driverid.name;
    }
    
    // Try to find driver by ID if not expanded
    const driver = drivers.find(d => d.id === commission.driverid);
    return driver ? driver.name : 'Unknown Driver';
  };

  // Open commission details modal
  const openCommissionModal = (commission) => {
    setCurrentCommission(commission);
    setShowCommissionModal(true);
  };

  // Open annual fee payment modal
  const openAnnualFeeModal = (driver) => {
    setCurrentDriver(driver);
    setShowAnnualFeeModal(true);
  };

  // Open hire details view
  const viewHireDetails = async (hireId) => {
    try {
      const response = await fetch(`${HIRES_API}/${hireId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const hire = await response.json();
      setViewDetails(hire);
    } catch (err) {
      console.error('Error fetching hire details:', err);
      alert(`Failed to load hire details: ${err.message}`);
    }
  };

  // Modal components
  const CommissionModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Commission Payment Details</h2>
        
        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Driver:</span>
            <span className="value">{getDriverName(currentCommission)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Hire ID:</span>
            <span className="value">{currentCommission.hireid}</span>
          </div>
          <div className="detail-row">
            <span className="label">Base Amount:</span>
            <span className="value">{formatCurrency(currentCommission.base_amount)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Commission (10%):</span>
            <span className="value highlight">{formatCurrency(currentCommission.commition)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`value status ${currentCommission.ispayed ? 'paid' : 'unpaid'}`}>
              {currentCommission.ispayed ? 'Paid' : 'Unpaid'}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{formatDate(currentCommission.created)}</span>
          </div>
        </div>
        
        <div className="hire-link">
          <button onClick={() => viewHireDetails(currentCommission.hireid)}>
            View Hire Details
          </button>
        </div>
        
        <div className="modal-actions">
          <button onClick={() => setShowCommissionModal(false)}>Close</button>
          {!currentCommission.ispayed && (
            <button 
              className="primary-btn"
              onClick={() => handleMarkCommissionPaid(currentCommission.id)}
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const AnnualFeeModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Annual Fee Payment</h2>
        
        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Driver:</span>
            <span className="value">{currentDriver.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{currentDriver.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{currentDriver.phonenumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Annual Fee for {yearFilter}:</span>
            <span className="value highlight">LKR 200.00</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`value status ${currentDriver.anuualfee_paid ? 'paid' : 'unpaid'}`}>
              {currentDriver.anuualfee_paid ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={() => setShowAnnualFeeModal(false)}>Close</button>
          {!currentDriver.anuualfee_paid && (
            <button 
              className="primary-btn"
              onClick={() => handleMarkAnnualFeePaid(currentDriver.id)}
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const HireDetailsModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Hire Details</h2>
        
        {viewDetails && (
          <div className="hire-details">
            <div className="detail-row">
              <span className="label">Hire ID:</span>
              <span className="value">{viewDetails.id}</span>
            </div>
            <div className="detail-row">
              <span className="label">Customer ID:</span>
              <span className="value">{viewDetails.user_id}</span>
            </div>
            <div className="detail-row">
              <span className="label">Pickup:</span>
              <span className="value">{viewDetails.pick_location}</span>
            </div>
            <div className="detail-row">
              <span className="label">Drop-off:</span>
              <span className="value">{viewDetails.drop_off_location}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(viewDetails.date)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Trip Type:</span>
              <span className="value">{viewDetails.isroundtrip ? 'Round Trip' : 'One Way'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Vehicle Type:</span>
              <span className="value">{viewDetails.vehicle_type}</span>
            </div>
            <div className="detail-row">
              <span className="label">Passengers:</span>
              <span className="value">{viewDetails.passengers}</span>
            </div>
            <div className="detail-row">
              <span className="label">Completed At:</span>
              <span className="value">{formatDate(viewDetails.completed_at)}</span>
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          <button onClick={() => setViewDetails(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="payments-container">
      {/* Header */}
      <div className="payments-header">
        <h1>Payments Management</h1>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('commissions')}
          >
            Driver Commissions
          </button>
          <button 
            className={`tab ${activeTab === 'annual-fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('annual-fees')}
          >
            Annual Fees
          </button>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'commissions' ? 'commissions' : 'drivers'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <button className="filter-btn">
              <FaFilter /> Filter: {statusFilter === 'all' ? 'All' : statusFilter === 'paid' ? 'Paid' : 'Unpaid'}
            </button>
            <div className="filter-options">
              <button 
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={statusFilter === 'paid' ? 'active' : ''}
                onClick={() => setStatusFilter('paid')}
              >
                Paid
              </button>
              <button 
                className={statusFilter === 'unpaid' ? 'active' : ''}
                onClick={() => setStatusFilter('unpaid')}
              >
                Unpaid
              </button>
            </div>
          </div>
          
          {/* {activeTab === 'commissions' && (
            <button className="add-payment-btn" onClick={handleAddCommission}>
              <FaPlus />
              <span>Process New Commissions</span>
            </button>
          )} */}
          
          {/* {activeTab === 'annual-fees' && (
            <div className="year-selector">
              <label>Year:</label>
              <select 
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>
          )} */}
        </div>
      </div>

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="commissions-section">
          {loading ? (
            <div className="loading">Loading commission data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Driver</th>
                    <th>Hire ID</th>
                    <th>Base Amount</th>
                    <th>Commission (10%)</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-results">
                        No commission records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCommissions.map(commission => (
                      <tr key={commission.id}>
                        <td className="id-cell">{commission.id.substring(0, 8)}</td>
                        <td>{getDriverName(commission)}</td>
                        <td>{commission.hireid && commission.hireid.substring(0, 8)}</td>
                        <td className="amount">{formatCurrency(commission.base_amount)}</td>
                        <td className="amount highlight">{formatCurrency(commission.commition)}</td>
                        <td>{formatDate(commission.created)}</td>
                        <td>
                          <span className={`status-badge ${commission.ispayed ? 'completed' : 'pending'}`}>
                            {commission.ispayed ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="view-btn" 
                            onClick={() => openCommissionModal(commission)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {!commission.ispayed && (
                            <button 
                              className="mark-paid-btn" 
                              onClick={() => handleMarkCommissionPaid(commission.id)}
                              title="Mark as Paid"
                            >
                              <FaCheck />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Annual Fees Tab */}
      {activeTab === 'annual-fees' && (
        <div className="annual-fees-section">
          {loading ? (
            <div className="loading">Loading driver data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Driver ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Annual Fee ({yearFilter})</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-results">
                        No drivers found.
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map(driver => (
                      <tr key={driver.id}>
                        <td className="id-cell">{driver.id.substring(0, 8)}</td>
                        <td>{driver.name}</td>
                        <td>{driver.email}</td>
                        <td>{driver.phonenumber}</td>
                        <td className="amount highlight">LKR 200.00</td>
                        <td>{formatDate(driver.created)}</td>
                        <td>
                          <span className={`status-badge ${driver.anuualfee_paid ? 'completed' : 'pending'}`}>
                            {driver.anuualfee_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="view-btn" 
                            onClick={() => openAnnualFeeModal(driver)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {!driver.anuualfee_paid && (
                            <button 
                              className="mark-paid-btn" 
                              onClick={() => handleMarkAnnualFeePaid(driver.id)}
                              title="Mark as Paid"
                            >
                              <FaCheck />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCommissionModal && currentCommission && <CommissionModal />}
      {showAnnualFeeModal && currentDriver && <AnnualFeeModal />}
      {viewDetails && <HireDetailsModal />}
    </div>
  );
};

export default Payments;