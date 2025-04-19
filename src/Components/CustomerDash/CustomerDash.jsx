import React, { useState, useEffect } from 'react';
// import { 
//   FaUser, FaCar, FaUserTie, FaMapMarkerAlt, FaCalendarAlt, 
//   FaCheck, FaTimesCircle, FaEllipsisV, FaCircle, FaPhoneAlt 
// } from 'react-icons/fa';
// Update your import statement to include FaSearch
import { 
  FaUser, FaCar, FaUserTie, FaMapMarkerAlt, FaCalendarAlt, 
  FaCheck, FaTimesCircle, FaEllipsisV, FaCircle, FaPhoneAlt,
  FaSearch // Add this
} from 'react-icons/fa';
import './RequestHandler.css';

// API base URL
const API_URL = 'http://145.223.21.62:8085/api/collections';
const HIRES_API = `${API_URL}/hire/records`;
const DRIVERS_API = `${API_URL}/driver/records`;
const REQUEST_HANDLE_API = `${API_URL}/request_handle/records`;

const RequestHandler = () => {
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingHires, setPendingHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentHire, setCurrentHire] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverRequests, setDriverRequests] = useState({});


  const fetchPendingHires = async () => {
    try {
      // Step 1: Get all driver requests with driver expansion
      // Use pagination to get ALL request records
      let allRequests = [];
      let page = 1;
      const perPage = 1000; // Fetch 100 records per request
      let hasMoreRecords = true;
      
      while (hasMoreRecords) {
        const requestsResponse = await fetch(`${REQUEST_HANDLE_API}?expand=driver_id&page=${page}&perPage=${perPage}`);
        
        if (!requestsResponse.ok) {
          throw new Error(`HTTP error! Status: ${requestsResponse.status}`);
        }
        
        const requestsData = await requestsResponse.json();
        allRequests = [...allRequests, ...requestsData.items];
        
        // Check if we've reached the end
        if (requestsData.items.length < perPage || page >= requestsData.totalPages) {
          hasMoreRecords = false;
        } else {
          page++;
        }
      }
      
      console.log("Driver requests:", allRequests);
      
      // If no requests, return early
      if (allRequests.length === 0) {
        setPendingHires([]);
        setDriverRequests({});
        return;
      }
      
      // Step 2: Get ALL pending hires - make sure the user_id is properly expanded
      // Use pagination to get ALL hire records - now sorted by created1 to show newest first
      let allHires = [];
      page = 1;
      hasMoreRecords = true;
      
      while (hasMoreRecords) {
        const hiresResponse = await fetch(`${HIRES_API}?filter=(ispending=true)&expand=user_id&fields=*,expand.user_id.usertype,expand.user_id.full_name,expand.user_id.phonenumber,expand.user_id.photo&sort=-created1&page=${page}&perPage=${perPage}`);
        
        if (!hiresResponse.ok) {
          throw new Error(`HTTP error! Status: ${hiresResponse.status}`);
        }
        
        const hiresData = await hiresResponse.json();
        allHires = [...allHires, ...hiresData.items];
        
        // Check if we've reached the end
        if (hiresData.items.length < perPage || page >= hiresData.totalPages) {
          hasMoreRecords = false;
        } else {
          page++;
        }
      }
      
      console.log("All pending hires:", allHires);
      
      // Step 3: Directly fetch the customer information for user IDs in the hires
      // This is a backup method if expand doesn't work
      const userIds = new Set();
      allHires.forEach(hire => {
        if (hire.user_id) {
          userIds.add(hire.user_id);
        }
      });
      
      let userTypeMap = {};
      if (userIds.size > 0) {
        try {
          // Fetch ALL customer data using pagination
          let allCustomers = [];
          page = 1;
          hasMoreRecords = true;
          
          while (hasMoreRecords) {
            const customersResponse = await fetch(`${API_URL}/customer/records?page=${page}&perPage=${perPage}`);
            
            if (customersResponse.ok) {
              const customersData = await customersResponse.json();
              allCustomers = [...allCustomers, ...customersData.items];
              
              // Check if we've reached the end
              if (customersData.items.length < perPage || page >= customersData.totalPages) {
                hasMoreRecords = false;
              } else {
                page++;
              }
            } else {
              throw new Error(`HTTP error! Status: ${customersResponse.status}`);
            }
          }
          
          // Create map of user id to usertype and also store phone numbers
          allCustomers.forEach(customer => {
            userTypeMap[customer.id] = {
              usertype: customer.usertype,
              phonenumber: customer.phonenumber ? customer.phonenumber.toString() : null,
              full_name: customer.full_name || 'Unknown Customer'
            };
          });
          console.log("User type map:", userTypeMap);
        } catch (err) {
          console.error("Error fetching customers:", err);
        }
      }
      
      // Step 4: Extract hire IDs from requests
      const hireIdsWithRequests = new Set(allRequests.map(req => req.hire_id));
      console.log("Hire IDs with requests:", Array.from(hireIdsWithRequests));
      
      // Step 5: Filter hires in memory
      const filteredHires = allHires.filter(hire => {
        // Check if this hire has any driver requests
        const hasRequest = hireIdsWithRequests.has(hire.id);
        
        // Get user type either from expand or from our backup map
        let userType = hire.expand?.user_id?.usertype;
        
        // If userType is undefined, try to get it from our backup map
        if (!userType && hire.user_id && userTypeMap[hire.user_id]) {
          userType = userTypeMap[hire.user_id].usertype;
          
          // Add it to the expand object for later use
          if (!hire.expand) hire.expand = {};
          if (!hire.expand.user_id) hire.expand.user_id = {};
          hire.expand.user_id.usertype = userType;
          
          // If there's no expanded user data but we have backup data, add it
          if (!hire.expand.user_id.phonenumber && userTypeMap[hire.user_id].phonenumber) {
            hire.expand.user_id.phonenumber = userTypeMap[hire.user_id].phonenumber;
          }
          
          if (!hire.expand.user_id.full_name && userTypeMap[hire.user_id].full_name) {
            hire.expand.user_id.full_name = userTypeMap[hire.user_id].full_name;
          }
        }
        
        const isValidCustomerType = userType === 'business_customer' || 
        userType === 'normal' || 
        userType === 'normal_customer' ||
        userType === undefined;
        
        console.log(`Hire ${hire.id}: hasRequest=${hasRequest}, userType=${userType}, isValidCustomerType=${isValidCustomerType}`);
        
        // Normal check with both conditions
        return hasRequest && isValidCustomerType;
      });
      
      // Ensure hires are sorted by created1 in descending order (newest first)
      filteredHires.sort((a, b) => {
        if (!a.created1 && !b.created1) return 0;
        if (!a.created1) return 1;
        if (!b.created1) return -1;
        return new Date(b.created1) - new Date(a.created1);
      });
      
      console.log("Filtered hires:", filteredHires);
      
      setPendingHires(filteredHires);
      
      // Step 6: Organize driver requests by hire ID for efficient lookup
      const requestsByHire = {};
      
      allRequests.forEach(request => {
        if (!requestsByHire[request.hire_id]) {
          requestsByHire[request.hire_id] = [];
        }
        requestsByHire[request.hire_id].push(request);
      });
      
      console.log("Requests by hire:", requestsByHire);
      setDriverRequests(requestsByHire);
      
      // Explicitly update filteredHires as well to ensure the UI updates
      setFilteredHires(filteredHires);
    } catch (err) {
      console.error('Error fetching pending hires:', err);
      setError('Failed to load pending hire requests.');
    }
  };

// // Fetch all pending hires that have driver requests
// const fetchPendingHires = async () => {
//   try {
//     // Step 1: Get all driver requests with driver expansion
//     const requestsResponse = await fetch(`${REQUEST_HANDLE_API}?expand=driver_id`);
    
//     if (!requestsResponse.ok) {
//       throw new Error(`HTTP error! Status: ${requestsResponse.status}`);
//     }
    
//     const requestsData = await requestsResponse.json();
//     const requests = requestsData.items;
    
//     console.log("Driver requests:", requests);
    
//     // If no requests, return early
//     if (requests.length === 0) {
//       setPendingHires([]);
//       setDriverRequests({});
//       return;
//     }
    
//     // Step 2: Get ALL pending hires - make sure the user_id is properly expanded
//     // Use the full expand parameter - this is the critical fix
//     const hiresResponse = await fetch(`${HIRES_API}?filter=(ispending=true)&expand=user_id&fields=*,expand.user_id.usertype,expand.user_id.full_name,expand.user_id.phonenumber,expand.user_id.photo`);
    
//     if (!hiresResponse.ok) {
//       throw new Error(`HTTP error! Status: ${hiresResponse.status}`);
//     }
    
//     const hiresData = await hiresResponse.json();
//     console.log("All pending hires:", hiresData.items);
    
//     // Step 3: Directly fetch the customer information for user IDs in the hires
//     // This is a backup method if expand doesn't work
//     const userIds = new Set();
//     hiresData.items.forEach(hire => {
//       if (hire.user_id) {
//         userIds.add(hire.user_id);
//       }
//     });
    
//     let userTypeMap = {};
//     if (userIds.size > 0) {
//       try {
//         // Fetch customer data 
//         const customersResponse = await fetch(`${API_URL}/customer/records`);
//         if (customersResponse.ok) {
//           const customersData = await customersResponse.json();
//           // Create map of user id to usertype
//           customersData.items.forEach(customer => {
//             userTypeMap[customer.id] = customer.usertype;
//           });
//           console.log("User type map:", userTypeMap);
//         }
//       } catch (err) {
//         console.error("Error fetching customers:", err);
//       }
//     }
    
//     // Step 4: Extract hire IDs from requests
//     const hireIdsWithRequests = new Set(requests.map(req => req.hire_id));
//     console.log("Hire IDs with requests:", Array.from(hireIdsWithRequests));
    
//     // Step 5: Filter hires in memory
//     const filteredHires = hiresData.items.filter(hire => {
//       // Check if this hire has any driver requests
//       const hasRequest = hireIdsWithRequests.has(hire.id);
      
//       // Get user type either from expand or from our backup map
//       let userType = hire.expand?.user_id?.usertype;
      
//       // If userType is undefined, try to get it from our backup map
//       if (!userType && hire.user_id && userTypeMap[hire.user_id]) {
//         userType = userTypeMap[hire.user_id];
        
//         // Add it to the expand object for later use
//         if (!hire.expand) hire.expand = {};
//         if (!hire.expand.user_id) hire.expand.user_id = {};
//         hire.expand.user_id.usertype = userType;
//       }
      
//       const isValidCustomerType = userType === 'business_customer' || 
//       userType === 'normal' || 
//       userType === 'normal_customer' ||
//       userType === undefined;
      
//       console.log(`Hire ${hire.id}: hasRequest=${hasRequest}, userType=${userType}, isValidCustomerType=${isValidCustomerType}`);
      
      
//       return hasRequest && isValidCustomerType;
//     });
    
//     console.log("Filtered hires:", filteredHires);
    
//     setPendingHires(filteredHires);
    
//     // Step 6: Organize driver requests by hire ID for efficient lookup
//     const requestsByHire = {};
    
//     requests.forEach(request => {
//       if (!requestsByHire[request.hire_id]) {
//         requestsByHire[request.hire_id] = [];
//       }
//       requestsByHire[request.hire_id].push(request);
//     });
    
//     console.log("Requests by hire:", requestsByHire);
//     setDriverRequests(requestsByHire);
    
//     // Explicitly update filteredHires as well to ensure the UI updates
//     setFilteredHires(filteredHires);
//   } catch (err) {
//     console.error('Error fetching pending hires:', err);
//     setError('Failed to load pending hire requests.');
//   }
// };

  const fetchDriverRequestsForHires = async (hires) => {
    try {
      const requests = {};
      
      await Promise.all(hires.map(async (hire) => {
        // Use pagination to get ALL request records for this hire
        let allRequests = [];
        let page = 1;
        const perPage = 100; // Fetch 100 records per request
        let hasMoreRecords = true;
        
        while (hasMoreRecords) {
          const response = await fetch(`${REQUEST_HANDLE_API}?filter=(hire_id="${hire.id}")&expand=driver_id&page=${page}&perPage=${perPage}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          allRequests = [...allRequests, ...data.items];
          
          // Check if we've reached the end
          if (data.items.length < perPage || page >= data.totalPages) {
            hasMoreRecords = false;
          } else {
            page++;
          }
        }
        
        requests[hire.id] = allRequests;
      }));
      
      setDriverRequests(requests);
    } catch (err) {
      console.error('Error fetching driver requests:', err);
      setError('Failed to load driver requests.');
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchPendingHires();
      } catch (err) {
        console.error('Error loading request handler data:', err);
        setError('Failed to load request handler data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // // Filter hires based on selected filter
  // useEffect(() => {
  //   if (!pendingHires.length) {
  //     setFilteredHires([]);
  //     return;
  //   }

  //   let filtered = [...pendingHires];

  //   switch (activeFilter) {
  //     case 'business':
  //       filtered = pendingHires.filter(hire => hire.user_type === 'business');
  //       break;
  //     case 'normal':
  //       filtered = pendingHires.filter(hire => hire.user_type === 'normal');
  //       break;
  //     case 'multiple':
  //       filtered = pendingHires.filter(hire => 
  //         driverRequests[hire.id] && driverRequests[hire.id].length > 1
  //       );
  //       break;
  //     default:
  //       // 'all' - no filtering needed
  //       break;
  //   }

  //   setFilteredHires(filtered);
  // }, [pendingHires, activeFilter, driverRequests]);

  // Filter hires based on selected filter
// Filter hires based on selected filter
useEffect(() => {
  if (!pendingHires.length) {
    setFilteredHires([]);
    return;
  }

  let filtered = [...pendingHires];

  switch (activeFilter) {
    case 'business_customer':
      filtered = pendingHires.filter(hire => 
        hire.expand?.user_id?.usertype === 'business_customer'
      );
      break;
    case 'normal_customer':
      filtered = pendingHires.filter(hire => 
        hire.expand?.user_id?.usertype === 'normal' || 
        hire.expand?.user_id?.usertype === 'normal_customer'
      );
      break;
    case 'cab_service':
      filtered = pendingHires.filter(hire => 
        hire.expand?.user_id?.usertype === 'cab_service'
      );
      break;
    case 'multiple':
      filtered = pendingHires.filter(hire => 
        driverRequests[hire.id] && driverRequests[hire.id].length > 1
      );
      break;
    default:
      // 'all' - no filtering needed
      break;
  }

  setFilteredHires(filtered);
}, [pendingHires, activeFilter, driverRequests]);

  // Handle filter button click
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openAssignModal = async (hire) => {
    setCurrentHire(hire);
    setLoading(true);
    
    try {
      // Directly fetch the latest driver requests for this specific hire ID
      // Use pagination to get ALL request records for this hire
      let allRequests = [];
      let page = 1;
      const perPage = 100; // Fetch 100 records per request
      let hasMoreRecords = true;
      
      while (hasMoreRecords) {
        const response = await fetch(`${REQUEST_HANDLE_API}?filter=(hire_id="${hire.id}")&page=${page}&perPage=${perPage}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        allRequests = [...allRequests, ...data.items];
        
        // Check if we've reached the end
        if (data.items.length < perPage || page >= data.totalPages) {
          hasMoreRecords = false;
        } else {
          page++;
        }
      }
      
      console.log(`Direct driver requests for hire ${hire.id}:`, allRequests);
      
      // If we found driver requests, fetch the driver details for each
      if (allRequests && allRequests.length > 0) {
        const driverIds = allRequests.map(request => request.driver_id).filter(Boolean);
        console.log("Driver IDs from requests:", driverIds);
        
        if (driverIds.length > 0) {
          // Create a filter to get all these drivers at once
          const driverIdsFilter = driverIds.map(id => `id="${id}"`).join(" || ");
          
          // Use pagination to get ALL drivers that match our filter
          let allDrivers = [];
          page = 1;
          hasMoreRecords = true;
          
          while (hasMoreRecords) {
            const driversResponse = await fetch(`${DRIVERS_API}?filter=(${driverIdsFilter})&page=${page}&perPage=${perPage}`);
            
            if (!driversResponse.ok) {
              throw new Error(`HTTP error! Status: ${driversResponse.status}`);
            }
            
            const driversData = await driversResponse.json();
            allDrivers = [...allDrivers, ...driversData.items];
            
            // Check if we've reached the end
            if (driversData.items.length < perPage || page >= driversData.totalPages) {
              hasMoreRecords = false;
            } else {
              page++;
            }
          }
          
          console.log("Fetched drivers:", allDrivers);
          setAvailableDrivers(allDrivers);
        } else {
          setAvailableDrivers([]);
        }
      } else {
        console.log("No driver requests found for this hire");
        setAvailableDrivers([]);
      }
    } catch (err) {
      console.error(`Error fetching driver requests for hire ${hire.id}:`, err);
      setAvailableDrivers([]);
    } finally {
      setLoading(false);
    }
    
    setSelectedDriver(null);
    setShowAssignModal(true);
  };


// Handle assigning a driver to a hire
const handleAssignDriver = async () => {
  if (!selectedDriver || !currentHire) {
    alert('Please select a driver');
    return;
  }
  
  try {
    console.log("Selected driver:", selectedDriver);
    console.log("Current hire:", currentHire);
    
    // 1. Update the hire record with the selected driver ID
    const hireResponse = await fetch(`${HIRES_API}/${currentHire.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        driverid: selectedDriver.id,
        ispending: false,
        accepted_at: new Date().toISOString()
      })
    });
    
    if (!hireResponse.ok) {
      throw new Error(`HTTP error! Status: ${hireResponse.status}`);
    }
    
    // 2. Find the request_handle record for this hire and driver
    // Fix the filter syntax - use separate parameters instead of &&
    const requestResponse = await fetch(`${REQUEST_HANDLE_API}?filter=(hire_id="${currentHire.id}")&filter=(driver_id="${selectedDriver.id}")`);
    
    if (!requestResponse.ok) {
      throw new Error(`HTTP error! Status: ${requestResponse.status}`);
    }
    
    const requestData = await requestResponse.json();
    console.log("Request handle records for this hire and driver:", requestData);
    
    if (requestData.items && requestData.items.length > 0) {
      const requestId = requestData.items[0].id;
      
      // 3. Update the request_handle record
      const updateResponse = await fetch(`${REQUEST_HANDLE_API}/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_accepted: true,
          accepted_at: new Date().toISOString()
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`HTTP error! Status: ${updateResponse.status}`);
      }
    } else {
      console.warn("No matching request_handle record found for this hire and driver");
      
      // If no matching record was found but we still want to mark the hire as assigned,
      // we can continue without updating a request_handle record
    }
    
    // 4. Refresh data
    await fetchPendingHires();
    
    // 5. Close modal
    setShowAssignModal(false);
    setCurrentHire(null);
    setSelectedDriver(null);
    
    alert('Driver assigned successfully!');
  } catch (err) {
    console.error('Error assigning driver:', err);
    alert(`Failed to assign driver: ${err.message}`);
  }
};
  // Get avatar URL or initials
  const getAvatarContent = (person, type) => {
    if (!person) return '?';
    
    if (type === 'customer') {
      if (person.photo) {
        return `http://145.223.21.62:8085/api/files/customer/${person.id}/${person.photo}`;
      }
      return person.full_name ? person.full_name.charAt(0) : '?';
    } else {
      if (person.photo) {
        return `http://145.223.21.62:8085/api/files/driver/${person.id}/${person.photo}`;
      }
      return person.name ? person.name.charAt(0) : '?';
    }
  };

  // Check if a hire has multiple driver requests
  const hasMultipleRequests = (hireId) => {
    return driverRequests[hireId] && driverRequests[hireId].length > 1;
  };

  // Get the number of driver requests for a hire
  const getRequestCount = (hireId) => {
    return driverRequests[hireId] ? driverRequests[hireId].length : 0;
  };


const [driverSearchTerm, setDriverSearchTerm] = useState('');

const filteredDrivers = availableDrivers.filter(driver => {
  const searchLower = driverSearchTerm.toLowerCase();
  return (
    driver.id.toLowerCase().includes(searchLower) ||
    (driver.phonenumber && String(driver.phonenumber).toLowerCase().includes(searchLower)) ||
    (driver.name && driver.name.toLowerCase().includes(searchLower))
  );
});

  return (
    <div className="request-handler-container">
      {loading ? (
        <div className="loading">Loading request data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <h2 className="section-title">Driver Assignment Management</h2>
          
          <div className="dashboard-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <FaCar />
              </div>
              <div className="metric-content">
                <p className="metric-title">Pending Business/Normal Hires</p>
                <h2 className="metric-value">{pendingHires.length}</h2>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <FaUserTie />
              </div>
              <div className="metric-content">
                <p className="metric-title">Driver Requests</p>
                <h2 className="metric-value">
                  {Object.values(driverRequests).reduce((total, requests) => total + requests.length, 0)}
                </h2>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <FaCircle className="multi-request-icon" />
              </div>
              <div className="metric-content">
                <p className="metric-title">Multi-Request Hires</p>
                <h2 className="metric-value">
                  {pendingHires.filter(hire => hasMultipleRequests(hire.id)).length}
                </h2>
              </div>
            </div>
          </div>
          
          <div className="hires-container">
            <div className="section-header">
              <h3>Pending Business & Normal Customer Requests</h3>
              <div className="filter-controls">
  <button 
    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
    onClick={() => handleFilterChange('all')}
  >
    All Requests
  </button>
  <button 
    className={`filter-btn ${activeFilter === 'business_customer' ? 'active' : ''}`}
    onClick={() => handleFilterChange('business_customer')}
  >
    Business
  </button>
  <button 
    className={`filter-btn ${activeFilter === 'normal_customer' ? 'active' : ''}`}
    onClick={() => handleFilterChange('normal_customer')}
  >
    Normal
  </button>
  {/* <button 
    className={`filter-btn ${activeFilter === 'cab_service' ? 'active' : ''}`}
    onClick={() => handleFilterChange('cab_service')}
  >
    Cab Service
  </button> */}
  <button 
    className={`filter-btn ${activeFilter === 'multiple' ? 'active' : ''}`}
    onClick={() => handleFilterChange('multiple')}
  >
    Multiple Drivers
  </button>
</div>
            </div>
            
            <div className="hires-list">
              {filteredHires.length === 0 ? (
                <div className="empty-list">No matching hire requests</div>
              ) : (
                filteredHires.map(hire => {
                  const customerName = hire.expand?.user_id?.full_name || 'Unknown Customer';
                  const requestCount = getRequestCount(hire.id);
                  
                  return (
                    <div key={hire.id} className={`hire-card ${hasMultipleRequests(hire.id) ? 'multi-request' : ''}`}>
    <div className="hire-header">
      <div className="customer-info">
        {hire.expand?.user_id ? (
          <>
            {typeof getAvatarContent(hire.expand.user_id, 'customer') === 'string' && 
             getAvatarContent(hire.expand.user_id, 'customer').startsWith('http') ? (
              <img 
                src={getAvatarContent(hire.expand.user_id, 'customer')} 
                alt={customerName} 
                className="customer-avatar" 
              />
            ) : (
              <div className="avatar-placeholder customer-avatar">
                {getAvatarContent(hire.expand.user_id, 'customer')}
              </div>
            )}
            <div>
              {/* Show either customer name or primary phone number if it's an unknown customer */}
              <h4>{customerName === 'Unknown Customer' && hire.primary_phone ? hire.primary_phone : customerName}</h4>
              <p className="user-contact">
                {hire.expand.user_id.phonenumber || hire.primary_phone || 'No phone'} 
                {hire.expand?.user_id?.usertype && (
                  <span className={`user-type ${hire.expand.user_id.usertype}`}>
                    • {hire.expand.user_id.usertype.charAt(0).toUpperCase() + hire.expand.user_id.usertype.slice(1).replace('_', ' ')}
                  </span>
                )}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="avatar-placeholder customer-avatar">?</div>
            <div>
              {/* When there's no user_id but there is a primary_phone, show that as the name */}
              <h4>{hire.primary_phone ? hire.primary_phone : 'Unknown Customer'}</h4>
              <p className="user-contact">{hire.primary_phone ? hire.primary_phone : 'No contact info'}</p>
            </div>
          </>
        )}
      </div>
      
      <div className="request-badge">
        <span className="request-count">{requestCount}</span>
        <span className="request-label">driver request{requestCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
                      
                      <div className="hire-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <FaMapMarkerAlt className="detail-icon pickup" />
                            <div>
                              <p className="detail-label">Pickup</p>
                              <p className="detail-value">{hire.pick_location}</p>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <FaMapMarkerAlt className="detail-icon dropoff" />
                            <div>
                              <p className="detail-label">Drop-off</p>
                              <p className="detail-value">{hire.drop_off_location}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="detail-row">
                          <div className="detail-item">
                            <FaCalendarAlt className="detail-icon" />
                            <div>
                            <p className="detail-value">
  {formatDate(hire.date)} at {formatTime(hire.created1)}
</p>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <FaUserTie className="detail-icon" />
                            <div>
                              <p className="detail-label">Passengers</p>
                              <p className="detail-value">{hire.passengers || 1}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* {requestCount > 0 ? (
                        <div className="driver-preview">
                          <h5>Driver Requests ({requestCount})</h5>
                          <div className="driver-avatars">
                            {driverRequests[hire.id]?.slice(0, 3).map((request, index) => (
                              <div key={request.id} className="driver-avatar-container">
                                {request.expand?.driver_id ? (
                                  typeof getAvatarContent(request.expand.driver_id, 'driver') === 'string' && 
                                  getAvatarContent(request.expand.driver_id, 'driver').startsWith('http') ? (
                                    <img 
                                      src={getAvatarContent(request.expand.driver_id, 'driver')} 
                                      alt={request.expand.driver_id.name} 
                                      className="driver-avatar-small" 
                                    />
                                  ) : (
                                    <div className="avatar-placeholder driver-avatar-small">
                                      {getAvatarContent(request.expand.driver_id, 'driver')}
                                    </div>
                                  )
                                ) : (
                                  <div className="avatar-placeholder driver-avatar-small">?</div>
                                )}
                              </div>
                            ))}
                            {requestCount > 3 && (
                              <div className="more-drivers">+{requestCount - 3}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="no-drivers">No driver requests yet</div>
                      )} */}
                      
                      <div className="hire-actions">
                        <button 
                          className="view-details-btn"
                          onClick={() => openAssignModal(hire)}
                        >
                          View Details
                        </button>
                        
                        <button 
                          className="assign-driver-btn"
                          onClick={() => openAssignModal(hire)}
                          disabled={requestCount === 0}
                        >
                          Assign Driver
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
         
          {/* Driver Assignment Modal */}
{showAssignModal && currentHire && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative',
      animation: 'modalFadeIn 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        backgroundColor: '#f8fafc'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1e293b',
          margin: 0
        }}>Assign Driver to Hire</h2>
        <button 
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.8rem',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '5px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '36px',
            height: '36px'
          }}
          onClick={() => setShowAssignModal(false)}
          onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
        >
          &times;
        </button>
      </div>
      
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#334155',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            marginRight: '8px'
          }}></span>
          Hire Details
        </h3>
        
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Customer:</span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {currentHire.expand?.user_id?.full_name || 'Unknown Customer'}
                  {currentHire.expand?.user_id?.usertype && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      backgroundColor: currentHire.expand.user_id.usertype === 'business' ? '#dbeafe' : '#ecfdf5',
                      color: currentHire.expand.user_id.usertype === 'business' ? '#1e40af' : '#047857',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {currentHire.expand.user_id.usertype.charAt(0).toUpperCase() + 
                       currentHire.expand.user_id.usertype.slice(1).replace('_', ' ')}
                    </span>
                  )}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Contact:</span>
                <span style={{
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {currentHire.primary_phone || 'N/A'}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Pickup:</span>
                <span style={{
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  fontWeight: '500'
                }}>{currentHire.pick_location}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Drop-off:</span>
                <span style={{
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  fontWeight: '500'
                }}>{currentHire.drop_off_location}</span>
              </div>
              
              {currentHire.stop_location && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#64748b',
                    width: '100px',
                    flex: '0 0 100px'
                  }}>Stop:</span>
                  <span style={{
                    fontSize: '0.95rem',
                    color: '#0f172a'
                  }}>{currentHire.stop_location}</span>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Date & Time:</span>
                <span style={{
  fontSize: '0.95rem',
  color: '#0f172a',
  fontWeight: '500'
}}>
  {formatDate(currentHire.date)} at {formatTime(currentHire.created1)}
</span>
              </div>
              
              {currentHire.isroundtrip && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#64748b',
                    width: '100px',
                    flex: '0 0 100px'
                  }}>Return:</span>
                  <span style={{
                    fontSize: '0.95rem',
                    color: '#0f172a'
                  }}>
                    {formatDate(currentHire.return_date)} at {formatTime(currentHire.return_time)}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Passengers:</span>
                <span style={{
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    backgroundColor: '#e0f2fe',
                    borderRadius: '50%',
                    color: '#0284c7'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  {currentHire.passengers || 1}
                </span>
              </div>
              
              {currentHire.bags && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#64748b',
                    width: '100px',
                    flex: '0 0 100px'
                  }}>Bags:</span>
                  <span style={{
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '50%',
                      color: '#d97706'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    {currentHire.bags}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#64748b',
                  width: '100px',
                  flex: '0 0 100px'
                }}>Vehicle:</span>
                <span style={{
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  backgroundColor: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>{currentHire.vehicle_type || 'Standard'}</span>
              </div>
            </div>
          </div>
          
          {currentHire.description && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px dashed #e5e7eb'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#64748b',
                display: 'block',
                marginBottom: '4px'
              }}>Notes:</span>
              <span style={{
                fontSize: '0.95rem',
                color: '#0f172a',
                display: 'block',
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                borderLeft: '3px solid #cbd5e1'
              }}>{currentHire.description}</span>
            </div>
          )}
        </div>
      </div>
      
      <div style={{
        padding: '20px 24px'
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#334155',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            marginRight: '8px'
          }}></span>
          Select a Driver
        </h3>
        
        {availableDrivers.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <svg style={{
              display: 'block',
              margin: '0 auto 16px',
              color: '#94a3b8'
            }} xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div style={{
              fontSize: '1rem',
              fontWeight: '500'
            }}>No driver requests available for this hire.</div>
          </div>
        ) : (
          <>
            <div style={{
              position: 'relative',
              marginBottom: '20px'
            }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}>
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Search driver by ID or phone..."
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  fontSize: '0.95rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '4px',
              marginRight: '-4px'
            }}>
              {/* Group drivers into rows of 4 */}
              {Array.from({ length: Math.ceil(filteredDrivers.length / 4) }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '16px'
                }}>
                  {filteredDrivers.slice(rowIndex * 4, rowIndex * 4 + 4).map(driver => (
                    <div 
                      key={driver.id} 
                      style={{
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: `1px solid ${selectedDriver?.id === driver.id ? '#3b82f6' : '#e2e8f0'}`,
                        boxShadow: selectedDriver?.id === driver.id 
                          ? '0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: '#fff',
                        position: 'relative',
                        transform: selectedDriver?.id === driver.id ? 'translateY(-2px)' : 'none'
                      }}
                      onClick={() => setSelectedDriver(driver)}
                      onMouseOver={(e) => {
                        if (selectedDriver?.id !== driver.id) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedDriver?.id !== driver.id) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      <div style={{
                        padding: '16px',
                        backgroundColor: selectedDriver?.id === driver.id ? '#f0f9ff' : '#f8fafc',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {typeof getAvatarContent(driver, 'driver') === 'string' && 
                        getAvatarContent(driver, 'driver').startsWith('http') ? (
                          <img 
                            src={getAvatarContent(driver, 'driver')} 
                            alt={driver.name}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '3px solid #fff',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              margin: '0 auto'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            border: '3px solid #fff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            margin: '0 auto'
                          }}>
                            {getAvatarContent(driver, 'driver')}
                          </div>
                        )}
                        
                        {selectedDriver?.id === driver.id && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            <FaCheck />
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        padding: '16px'
                      }}>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: '0 0 6px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{driver.name}</h4>
                        
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#64748b',
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}>
                          ID: <span style={{
                            fontWeight: '500',
                            color: '#475569',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.02em'
                          }}>{driver.id.substring(0, 8)}</span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          color: '#475569',
                          gap: '6px',
                          justifyContent: 'center'
                        }}>
                          <FaPhoneAlt style={{ color: '#64748b', fontSize: '0.8rem' }} />
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {driver.phonenumber || 'No phone'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add empty placeholder cards if needed to complete the row */}
                  {rowIndex === Math.ceil(filteredDrivers.length / 4) - 1 && 
                   filteredDrivers.length % 4 !== 0 && 
                   Array.from({ length: 4 - (filteredDrivers.length % 4) }).map((_, i) => (
                     <div key={`empty-${i}`} style={{
                       height: 0,
                       padding: 0,
                       margin: 0
                     }}></div>
                   ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '16px 24px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        gap: '12px'
      }}>
        <button 
          style={{
            backgroundColor: '#fff',
            border: '1px solid #cbd5e1',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '500',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setShowAssignModal(false)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          Cancel
        </button>
        
        <button 
          style={{
            backgroundColor: selectedDriver && availableDrivers.length > 0 ? '#3b82f6' : '#cbd5e1',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '500',
            color: selectedDriver && availableDrivers.length > 0 ? '#fff' : '#64748b',
            cursor: selectedDriver && availableDrivers.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={handleAssignDriver}
          disabled={!selectedDriver || availableDrivers.length === 0}
          onMouseOver={(e) => {
            if (selectedDriver && availableDrivers.length > 0) {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (selectedDriver && availableDrivers.length > 0) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {selectedDriver && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          )}
          {selectedDriver ? `Assign ${selectedDriver.name}` : 'Assign Driver'}
        </button>
      </div>
    </div>
  </div>
)}
        </>
      )}
    </div>
  );
};

export default RequestHandler;