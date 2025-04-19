import React, { useState, useEffect } from 'react';
import './Hires.css';
import { FaPlus, FaSearch, FaFilter, FaEye, FaCheck, FaTimes, FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

// API base URL
const API_URL = 'http://145.223.21.62:8085/api/collections';
const HIRES_API = `${API_URL}/hire/records`;
const CUSTOMERS_API = `${API_URL}/customer/records`;
const DRIVERS_API = `${API_URL}/driver/records`;

const Hires = () => {
  // State for data
  const [hires, setHires] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New state for date filtering
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'daily', 'monthly', 'range'
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().split('T')[0].substring(0, 7) // YYYY-MM format
  });
  
  // State for modal
  const [selectedHire, setSelectedHire] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewHireModal, setShowNewHireModal] = useState(false);
  const [newHireForm, setNewHireForm] = useState({
    user_id: '',
    pick_location: '',
    drop_off_location: '',
    date: '',
    time: '',
    vehicle_type: '',
    passengers: 1,
    isroundtrip: false,
    primary_phone: '',
    driverid: '',
    ispending: true
  });

  // Update fetchHires function to use created instead of created1
const fetchHires = async () => {
  try {
    setLoading(true);
    
    // Initialize variables for pagination
    let allHires = [];
    let page = 1;
    const perPage = 100; // Fetch 100 records per request
    let hasMoreRecords = true;
    
    // Loop until all records are fetched
    while (hasMoreRecords) {
      // Use 'created' column for sorting (not created1)
      const response = await fetch(`${HIRES_API}?sort=-created&page=${page}&perPage=${perPage}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add current page items to our collection
      allHires = [...allHires, ...data.items];
      
      // Check if we've reached the end
      if (data.items.length < perPage || page >= data.totalPages) {
        hasMoreRecords = false;
      } else {
        page++;
      }
    }
    
    console.log(`Fetched a total of ${allHires.length} hires`);
    setHires(allHires);
    return allHires;
  } catch (err) {
    console.error('Error fetching hires:', err);
    setError('Failed to load hire records.');
    return [];
  } finally {
    setLoading(false);
  }
};
  
  // Updated getCustomer function to display just the phone number for unknown customers
  const getCustomer = (customerId) => {
    if (!customerId) return { full_name: 'Unknown Customer', phonenumber: null, email: 'N/A' };
    
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
      return { full_name: 'Unknown Customer', phonenumber: null, email: 'N/A', id: customerId };
    }
    
    return {
      ...customer,
      full_name: customer.full_name || 'Unnamed Customer',
      // Ensure phonenumber is converted to string if it exists
      phonenumber: customer.phonenumber !== undefined ? customer.phonenumber.toString() : null,
      email: customer.email || 'N/A'
    };
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    try {
      const date = new Date(timeString);
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        // Use toLocaleTimeString with options to ensure correct time zone handling
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true // This ensures AM/PM format
        });
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };
  
  // Fetch all customers using pagination
  const fetchCustomers = async () => {
    try {
      // Initialize variables for pagination
      let allCustomers = [];
      let page = 1;
      const perPage = 100; // Fetch 100 records per request
      let hasMoreRecords = true;
      
      // Loop until all records are fetched
      while (hasMoreRecords) {
        const response = await fetch(`${CUSTOMERS_API}?sort=full_name&page=${page}&perPage=${perPage}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add current page items to our collection
        allCustomers = [...allCustomers, ...data.items];
        
        // Check if we've reached the end
        if (data.items.length < perPage || page >= data.totalPages) {
          hasMoreRecords = false;
        } else {
          page++;
        }
      }
      
      console.log(`Fetched a total of ${allCustomers.length} customers`);
      setCustomers(allCustomers);
      return allCustomers;
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customer data.');
      return [];
    }
  };
  
  // Fetch all drivers using pagination
  const fetchDrivers = async () => {
    try {
      // Initialize variables for pagination
      let allDrivers = [];
      let page = 1;
      const perPage = 100; // Fetch 100 records per request
      let hasMoreRecords = true;
      
      // Loop until all records are fetched
      while (hasMoreRecords) {
        const response = await fetch(`${DRIVERS_API}?sort=name&page=${page}&perPage=${perPage}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add current page items to our collection
        allDrivers = [...allDrivers, ...data.items];
        
        // Check if we've reached the end
        if (data.items.length < perPage || page >= data.totalPages) {
          hasMoreRecords = false;
        } else {
          page++;
        }
      }
      
      console.log(`Fetched a total of ${allDrivers.length} drivers`);
      setDrivers(allDrivers);
      return allDrivers;
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load driver data.');
      return [];
    }
  };

  // // Fetch all hire records
  // const fetchHires = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetch(`${HIRES_API}?sort=-created`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
      
  //     const data = await response.json();
  //     setHires(data.items);
  //     return data.items;
  //   } catch (err) {
  //     console.error('Error fetching hires:', err);
  //     setError('Failed to load hire records.');
  //     return [];
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // // Fetch customers
  // const fetchCustomers = async () => {
  //   try {
  //     const response = await fetch(`${CUSTOMERS_API}?sort=full_name`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
      
  //     const data = await response.json();
  //     setCustomers(data.items);
  //     return data.items;
  //   } catch (err) {
  //     console.error('Error fetching customers:', err);
  //     setError('Failed to load customer data.');
  //     return [];
  //   }
  // };

  // // Fetch drivers
  // const fetchDrivers = async () => {
  //   try {
  //     const response = await fetch(`${DRIVERS_API}?sort=name`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
      
  //     const data = await response.json();
  //     setDrivers(data.items);
  //     return data.items;
  //   } catch (err) {
  //     console.error('Error fetching drivers:', err);
  //     setError('Failed to load driver data.');
  //     return [];
  //   }
  // };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchHires(),
          fetchCustomers(),
          fetchDrivers()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);



// Get driver details by ID with improved null handling
const getDriver = (driverId) => {
  if (!driverId) return { name: 'Unassigned', address: 'N/A', phonenumber: 'N/A', email: 'N/A' };
  
  const driver = drivers.find(d => d.id === driverId);
  
  if (!driver) {
    return { name: 'Unknown Driver', address: 'N/A', phonenumber: 'N/A', email: 'N/A', id: driverId };
  }
  
  return {
    ...driver,
    name: driver.name || 'Unnamed Driver',
    address: driver.address || 'N/A',
    phonenumber: driver.phonenumber || 'N/A',
    email: driver.email || 'N/A'
  };
};

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // // Format time
  // const formatTime = (timeString) => {
  //   if (!timeString) return 'N/A';
  //   const date = new Date(timeString);
  //   return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };

  // Get status text based on hire properties
  const getHireStatus = (hire) => {
    if (hire.is_cancelled) return 'Cancelled';
    if (hire.is_completed) return 'Completed';
    if (hire.driverid && !hire.ispending) return 'Accepted';
    return 'Pending';
  };

  // Handle date filter type change
  const handleDateFilterChange = (type) => {
    setDateFilterType(type);
    
    // Update date range based on filter type
    const today = new Date();
    
    if (type === 'daily') {
      // Today
      setDateRange({
        ...dateRange,
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    } else if (type === 'monthly') {
      // Current month
      const currentMonth = today.toISOString().split('T')[0].substring(0, 7);
      setDateRange({
        ...dateRange,
        month: currentMonth
      });
    } else if (type === 'range') {
      // Keep existing range or default to last 7 days
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      setDateRange({
        ...dateRange,
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    }
    
    // Close the dropdown after selection
    setShowDateFilter(false);
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  // Get date filter label
  const getDateFilterLabel = () => {
    switch (dateFilterType) {
      case 'daily':
        return `Daily (${formatDate(dateRange.startDate)})`;
      case 'monthly':
        const monthDate = new Date(dateRange.month + '-01');
        return `Monthly (${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
      case 'range':
        return `Range (${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)})`;
      default:
        return 'All Time';
    }
  };

  // // Check if hire date is within the selected date range
  // const isWithinDateRange = (hire) => {
  //   if (!hire.date) return false;
    
  //   const hireDate = new Date(hire.date);
  //   hireDate.setHours(0, 0, 0, 0);
    
  //   if (dateFilterType === 'all') {
  //     return true;
  //   }
    
  //   if (dateFilterType === 'daily') {
  //     const filterDate = new Date(dateRange.startDate);
  //     filterDate.setHours(0, 0, 0, 0);
  //     return hireDate.getTime() === filterDate.getTime();
  //   }
    
  //   if (dateFilterType === 'monthly') {
  //     const hireMonth = hire.date.substring(0, 7); // YYYY-MM format
  //     return hireMonth === dateRange.month;
  //   }
    
  //   if (dateFilterType === 'range') {
  //     const startDate = new Date(dateRange.startDate);
  //     startDate.setHours(0, 0, 0, 0);
      
  //     const endDate = new Date(dateRange.endDate);
  //     endDate.setHours(23, 59, 59, 999);
      
  //     return hireDate >= startDate && hireDate <= endDate;
  //   }
    
  //   return true;
  // };
  const isWithinDateRange = (hire) => {
    if (!hire.date) return false;
    
    try {
      const hireDate = new Date(hire.date);
      // Check if the date is valid
      if (isNaN(hireDate.getTime())) return false;
      
      hireDate.setHours(0, 0, 0, 0);
      
      if (dateFilterType === 'all') {
        return true;
      }
      
      if (dateFilterType === 'daily') {
        const filterDate = new Date(dateRange.startDate);
        filterDate.setHours(0, 0, 0, 0);
        return hireDate.getTime() === filterDate.getTime();
      }
      
      if (dateFilterType === 'monthly') {
        const hireMonth = hire.date.substring(0, 7); // YYYY-MM format
        return hireMonth === dateRange.month;
      }
      
      if (dateFilterType === 'range') {
        const startDate = new Date(dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        return hireDate >= startDate && hireDate <= endDate;
      }
      
      return true;
    } catch (error) {
      console.error('Error in date filtering:', error);
      return false;
    }
  };

  // Filter hires based on search term, status, and date range
  // const filteredHires = hires.filter(hire => {
  //   const customer = getCustomer(hire.user_id);
  //   const driver = getDriver(hire.driverid);
    
  //   const matchesSearch = 
  //     (customer.full_name && customer.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
  //     (customer.phonenumber && customer.phonenumber.toString().includes(searchTerm)) ||
  //     (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
  //     (hire.pick_location && hire.pick_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
  //     (hire.drop_off_location && hire.drop_off_location.toLowerCase().includes(searchTerm.toLowerCase()));
    
  //   const status = getHireStatus(hire);
  //   const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
  //   const matchesDateFilter = isWithinDateRange(hire);
    
  //   return matchesSearch && matchesStatus && matchesDateFilter;
  // });
  const filteredHires = hires
  .filter(hire => {
    const customer = getCustomer(hire.user_id);
    const driver = getDriver(hire.driverid);
    
    // Get the phone number to display - either from customer record or from hire's primary_phone
    const displayPhoneNumber = hire.primary_phone || (customer.phonenumber || '');
    
    const matchesSearch = 
      (customer.full_name && customer.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (displayPhoneNumber && displayPhoneNumber.toString().includes(searchTerm)) ||
      (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hire.pick_location && hire.pick_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hire.drop_off_location && hire.drop_off_location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const status = getHireStatus(hire);
    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDateFilter = isWithinDateRange(hire);
    
    return matchesSearch && matchesStatus && matchesDateFilter;
  })
  // Sort filtered results by created field in descending order (newest first)
  .sort((a, b) => {
    if (!a.created && !b.created) return 0;
    if (!a.created) return 1;
    if (!b.created) return -1;
    return new Date(b.created) - new Date(a.created);
  });

  // Handle creating a new hire
  const handleNewHire = () => {
    // Initialize form with default values
    setNewHireForm({
      user_id: customers.length > 0 ? customers[0].id : '',
      pick_location: '',
      drop_off_location: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      vehicle_type: 'Sedan',
      passengers: 1,
      isroundtrip: false,
      primary_phone: '',
      driverid: '',
      ispending: true
    });
    
    setShowNewHireModal(true);
  };

  // Handle submitting new hire form
  const handleSubmitNewHire = async (e) => {
    e.preventDefault();
    
    try {
      const requestBody = {
        ...newHireForm,
        date: new Date(newHireForm.date).toISOString(),
        time: new Date(`2000-01-01T${newHireForm.time}`).toISOString()
      };
      
      const response = await fetch(HIRES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchHires();
      setShowNewHireModal(false);
    } catch (err) {
      console.error('Error creating new hire:', err);
      alert(`Failed to create new hire: ${err.message}`);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewHireForm({
      ...newHireForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // View hire details
  const viewDetails = (hire) => {
    setSelectedHire(hire);
    setShowDetailModal(true);
  };

  // Handle marking hire as completed
  const handleCompleteHire = async (id) => {
    try {
      const response = await fetch(`${HIRES_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchHires();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error completing hire:', err);
      alert(`Failed to complete hire: ${err.message}`);
    }
  };

  // Handle cancelling a hire
  const handleCancelHire = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this hire?')) {
      return;
    }
    
    try {
      const response = await fetch(`${HIRES_API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_cancelled: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchHires();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error cancelling hire:', err);
      alert(`Failed to cancel hire: ${err.message}`);
    }
  };

  // Handle assigning a driver
  const handleAssignDriver = async (hireId, driverId) => {
    try {
      const response = await fetch(`${HIRES_API}/${hireId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverid: driverId,
          ispending: false,
          accepted_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchHires();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error assigning driver:', err);
      alert(`Failed to assign driver: ${err.message}`);
    }
  };

  // Calculate estimated amount
  const getEstimatedAmount = (hire) => {
    // This would be replaced by your actual pricing logic
    const baseRate = 10;
    let multiplier = 1;
    
    switch (hire.vehicle_type) {
      case 'Luxury':
        multiplier = 2;
        break;
      case 'SUV':
        multiplier = 1.5;
        break;
      default:
        multiplier = 1;
    }
    
    // Add a factor for passengers
    const passengerRate = hire.passengers > 2 ? (hire.passengers - 2) * 0.1 : 0;
    
    // Round-trip is twice the base price
    const roundTripMultiplier = hire.isroundtrip ? 1.8 : 1;
    
    return `LKR ${(baseRate * (1 + passengerRate) * multiplier * roundTripMultiplier).toFixed(2)}`;
  };

  const getAvatarContent = (person, type) => {
    if (!person) {
      return type === 'customer' ? 'C' : 'D';
    }
    
    if (type === 'customer') {
      if (person.photo && person.id) {
        return `http://145.223.21.62:8085/api/files/customer/${person.id}/${person.photo}`;
      }
      return person.full_name ? person.full_name.charAt(0).toUpperCase() : 'C';
    } else {
      if (person.photo && person.id) {
        return `http://145.223.21.62:8085/api/files/driver/${person.id}/${person.photo}`;
      }
      return person.name ? person.name.charAt(0).toUpperCase() : 'D';
    }
  };

  return (
    <div className="hires-container">
      {/* Header */}
      <div className="hires-header">
        <h1>Ride Hires</h1>
        
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search hires..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Date Filter Dropdown */}
          <div className="filter-dropdown">
            <button 
              className="filter-btn" 
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <FaCalendarAlt /> {getDateFilterLabel()} <FaChevronDown />
            </button>
            {showDateFilter && (
              <div className="filter-options date-filter">
                <button 
                  className={dateFilterType === 'all' ? 'active' : ''}
                  onClick={() => handleDateFilterChange('all')}
                >
                  All Time
                </button>
                <button 
                  className={dateFilterType === 'daily' ? 'active' : ''}
                  onClick={() => handleDateFilterChange('daily')}
                >
                  Daily
                </button>
                {dateFilterType === 'daily' && (
                  <div className="date-selector">
                    <input 
                      type="date" 
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                    />
                  </div>
                )}
                <button 
                  className={dateFilterType === 'monthly' ? 'active' : ''}
                  onClick={() => handleDateFilterChange('monthly')}
                >
                  Monthly
                </button>
                {dateFilterType === 'monthly' && (
                  <div className="date-selector">
                    <input 
                      type="month" 
                      name="month"
                      value={dateRange.month}
                      onChange={handleDateRangeChange}
                    />
                  </div>
                )}
                <button 
                  className={dateFilterType === 'range' ? 'active' : ''}
                  onClick={() => handleDateFilterChange('range')}
                >
                  Date Range
                </button>
                {dateFilterType === 'range' && (
                  <div className="date-selector range">
                    <div>
                      <label>From:</label>
                      <input 
                        type="date" 
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateRangeChange}
                      />
                    </div>
                    <div>
                      <label>To:</label>
                      <input 
                        type="date" 
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateRangeChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="filter-dropdown">
            <button className="filter-btn">
              <FaFilter /> Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </button>
            <div className="filter-options">
              <button 
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={statusFilter === 'pending' ? 'active' : ''}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={statusFilter === 'accepted' ? 'active' : ''}
                onClick={() => setStatusFilter('accepted')}
              >
                Accepted
              </button>
              <button 
                className={statusFilter === 'completed' ? 'active' : ''}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>
              <button 
                className={statusFilter === 'cancelled' ? 'active' : ''}
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Results Summary */}
      <div className="filter-summary">
        <div className="filter-chips">
          {dateFilterType !== 'all' && (
            <div className="filter-chip">
              <span>Date: {getDateFilterLabel()}</span>
              <button onClick={() => setDateFilterType('all')}>×</button>
            </div>
          )}
          {statusFilter !== 'all' && (
            <div className="filter-chip">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter('all')}>×</button>
            </div>
          )}
          {searchTerm && (
            <div className="filter-chip">
              <span>Search: {searchTerm}</span>
              <button onClick={() => setSearchTerm('')}>×</button>
            </div>
          )}
        </div>
        <div className="results-count">
          Showing {filteredHires.length} of {hires.length} hires
        </div>
      </div>

      {/* Hires Table */}
      {loading ? (
        <div className="loading">Loading hire data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="hires-table-container">
          <table className="hires-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Driver</th>
                <th>Pickup Location</th>
                <th>Drop-off Location</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHires.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-results">
                    No hires found matching your filters. Try adjusting your search criteria.
                  </td>
                </tr>
              ) : (
                filteredHires.map(hire => {
                  const customer = getCustomer(hire.user_id);
                  const driver = getDriver(hire.driverid);
                  const status = getHireStatus(hire);
                  const avatarCustomer = getAvatarContent(customer, 'customer');
                  const avatarDriver = getAvatarContent(driver, 'driver');
                  
                  // Get the phone number to display - prioritize primary_phone from hire, then customer phonenumber
                  const displayPhoneNumber = hire.primary_phone || (customer.phonenumber || 'N/A');
                  
                  return (
                    <tr key={hire.id}>
                      <td>
                        <div className="customer-cell">
                          {typeof avatarCustomer === 'string' && avatarCustomer.startsWith('http') ? (
                            <img 
                              src={avatarCustomer} 
                              alt={customer.full_name} 
                              className="avatar" 
                            />
                          ) : (
                            <div className="avatar-placeholder">{avatarCustomer}</div>
                          )}
                          <div className="customer-info">
                            <div className="name">{customer.full_name}</div>
                            <div className="phone">{displayPhoneNumber}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="driver-cell">
                          {driver.id ? (
                            <>
                              {typeof avatarDriver === 'string' && avatarDriver.startsWith('http') ? (
                                <img 
                                  src={avatarDriver} 
                                  alt={driver.name} 
                                  className="avatar" 
                                />
                              ) : (
                                <div className="avatar-placeholder">{avatarDriver}</div>
                              )}
                              <div className="driver-info">
                                <div className="name">{driver.name}</div>
                                <div className="vehicle">{driver.address || 'No address'}</div>
                              </div>
                            </>
                          ) : (
                            <div className="unassigned">No driver assigned</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="location">{hire.pick_location}</td>
                      <td className="location">{hire.drop_off_location}</td>
                      <td className="datetime">
  <div>{formatDate(hire.date)}</div>
  <div className="time">{formatTime(hire.created1)}</div>
</td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td className="amount">{getEstimatedAmount(hire)}</td>
                      <td>
                        <button 
                          className="view-details-btn" 
                          onClick={() => viewDetails(hire)}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal and form modals remain unchanged */}
      {showDetailModal && selectedHire && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Hire Details</h2>
            
            <div className="detail-section">
              <h3>Trip Information</h3>
              <div className="detail-row">
                <span className="label">ID:</span>
                <span className="value">{selectedHire.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Pickup:</span>
                <span className="value">{selectedHire.pick_location}</span>
              </div>
              <div className="detail-row">
                <span className="label">Drop-off:</span>
                <span className="value">{selectedHire.drop_off_location}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{formatDate(selectedHire.date)}</span>
              </div>
              <div className="detail-row">
  <span className="label">Time:</span>
  <span className="value">{formatTime(selectedHire.created1)}</span>
</div>
              <div className="detail-row">
                <span className="label">Trip Type:</span>
                <span className="value">{selectedHire.isroundtrip ? 'Round Trip' : 'One Way'}</span>
              </div>
              {selectedHire.isroundtrip && (
                <>
                  <div className="detail-row">
                    <span className="label">Return Date:</span>
                    <span className="value">{formatDate(selectedHire.return_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Return Time:</span>
                    <span className="value">{formatTime(selectedHire.return_time)}</span>
                  </div>
                </>
              )}
              <div className="detail-row">
                <span className="label">Vehicle Type:</span>
                <span className="value">{selectedHire.vehicle_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Passengers:</span>
                <span className="value">{selectedHire.passengers}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status ${getHireStatus(selectedHire).toLowerCase()}`}>
                  {getHireStatus(selectedHire)}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">{getEstimatedAmount(selectedHire)}</span>
              </div>
            </div>
            
            {/* Rest of the detail modal content stays the same */}
            <div className="detail-section">
  <h3>Customer Information</h3>
  <div className="detail-row">
    <span className="label">Name:</span>
    <span className="value">{getCustomer(selectedHire.user_id).full_name}</span>
  </div>
  <div className="detail-row">
    <span className="label">Phone:</span>
    <span className="value">
      {selectedHire.primary_phone || (getCustomer(selectedHire.user_id).phonenumber || 'N/A')}
    </span>
  </div>
  {selectedHire.alternative_phone && (
    <div className="detail-row">
      <span className="label">Alternative Phone:</span>
      <span className="value">{selectedHire.alternative_phone}</span>
    </div>
  )}
  <div className="detail-row">
    <span className="label">Email:</span>
    <span className="value">{getCustomer(selectedHire.user_id).email || 'Not available'}</span>
  </div>
</div>
            
            {selectedHire.driverid ? (
              <div className="detail-section">
                <h3>Driver Information</h3>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{getDriver(selectedHire.driverid).name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{getDriver(selectedHire.driverid).phonenumber || 'Not available'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{getDriver(selectedHire.driverid).email || 'Not available'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Address:</span>
                  <span className="value">{getDriver(selectedHire.driverid).address || 'Not available'}</span>
                </div>
              </div>
            ) : (
              <div className="detail-section">
                {/* <h3>Assign Driver</h3>
                <div className="driver-selection">
                  <select id="driver-select">
                    <option value="">Select a driver</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="assign-btn"
                    onClick={() => {
                      const driverId = document.getElementById('driver-select').value;
                      if (driverId) {
                        handleAssignDriver(selectedHire.id, driverId);
                      } else {
                        alert('Please select a driver');
                      }
                    }}
                  >
                    Assign Driver
                  </button>
                </div> */}
              </div>
            )}
            
            {selectedHire.description && (
              <div className="detail-section">
                <h3>Additional Notes</h3>
                <p className="description">{selectedHire.description}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              
              {!selectedHire.is_completed && !selectedHire.is_cancelled && selectedHire.driverid && (
                <button 
                  className="complete-btn"
                  onClick={() => handleCompleteHire(selectedHire.id)}
                >
                  <FaCheck /> Mark as Completed
                </button>
              )}
              
              {!selectedHire.is_completed && !selectedHire.is_cancelled && (
                <button 
                  className="cancel-btn"
                  onClick={() => handleCancelHire(selectedHire.id)}
                >
                  <FaTimes /> Cancel Hire
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Hire Modal */}
      {showNewHireModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Create New Hire</h2>
            
            <form onSubmit={handleSubmitNewHire}>
              <div className="form-section">
                <h3>Customer Information</h3>
                <div className="form-group">
                  <label htmlFor="user_id">Select Customer</label>
                  <select 
                    id="user_id"
                    name="user_id"
                    value={newHireForm.user_id}
                    onChange={handleFormChange}
                    required
                  >
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} ({customer.phonenumber || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="primary_phone">Primary Phone</label>
                  <input 
                    type="text"
                    id="primary_phone"
                    name="primary_phone"
                    value={newHireForm.primary_phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Trip Details</h3>
                <div className="form-group">
                  <label htmlFor="pick_location">Pickup Location</label>
                  <input 
                    type="text"
                    id="pick_location"
                    name="pick_location"
                    value={newHireForm.pick_location}
                    onChange={handleFormChange}
                    placeholder="Enter pickup address"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="drop_off_location">Drop-off Location</label>
                  <input 
                    type="text"
                    id="drop_off_location"
                    name="drop_off_location"
                    value={newHireForm.drop_off_location}
                    onChange={handleFormChange}
                    placeholder="Enter destination address"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="date">Date</label>
                    <input 
                      type="date"
                      id="date"
                      name="date"
                      value={newHireForm.date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group half">
                    <label htmlFor="time">Time</label>
                    <input 
                      type="time"
                      id="time"
                      name="time"
                      value={newHireForm.time}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group checkbox">
                  <label>
                    <input 
                      type="checkbox"
                      name="isroundtrip"
                      checked={newHireForm.isroundtrip}
                      onChange={handleFormChange}
                    />
                    Round Trip
                  </label>
                </div>
                
                {newHireForm.isroundtrip && (
                  <div className="form-row">
                    <div className="form-group half">
                      <label htmlFor="return_date">Return Date</label>
                      <input 
                        type="date"
                        id="return_date"
                        name="return_date"
                        value={newHireForm.return_date || ''}
                        onChange={handleFormChange}
                      />
                    </div>
                    
                    <div className="form-group half">
                      <label htmlFor="return_time">Return Time</label>
                      <input 
                        type="time"
                        id="return_time"
                        name="return_time"
                        value={newHireForm.return_time || ''}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="vehicle_type">Vehicle Type</label>
                    <select 
                      id="vehicle_type"
                      name="vehicle_type"
                      value={newHireForm.vehicle_type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>
                  
                  <div className="form-group half">
                    <label htmlFor="passengers">Passengers</label>
                    <input 
                      type="number"
                      id="passengers"
                      name="passengers"
                      value={newHireForm.passengers}
                      onChange={handleFormChange}
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowNewHireModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hires;