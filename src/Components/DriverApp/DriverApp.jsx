import React, { useState, useEffect } from 'react';
import './DriverApp.css';
import { FaChevronDown, FaSearch, FaPlus, FaEdit, FaTrash, FaIdCard, FaFileInvoiceDollar, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

/**
 * PocketBase API Details:
 * GET /api/collections/driver/records/:id
 * 
 * Path Parameters:
 * - id (String): ID of the record to view.
 * 
 * Query Parameters:
 * - expand (String): Auto expand record relations. Ex: ?expand=relField1,relField2.subRelField
 *   Supports up to 6-levels depth nested relations expansion.
 *   The expanded relations will be appended under the `expand` property.
 * 
 * - fields (String): Comma separated string of fields to return. Ex: ?fields=*,expand.relField.name
 *   '*' targets all keys from the specific depth level.
 *   Field modifiers: :excerpt(maxLength, withEllipsis?) - Returns short text version
 * 
 * Response (200):
 * {
 *   "collectionId": "pbc_645202327", 
 *   "collectionName": "driver", 
 *   "id": "test", 
 *   "phonenumber": 123, 
 *   "password": "test", 
 *   "name": "test", 
 *   "bday": "2022-01-01 10:00:00.123Z", 
 *   "email": "test@example.com", 
 *   "address": "test", 
 *   "isverified": true, 
 *   "photo": "filename.jpg", 
 *   "onesignal_player_id": "test", 
 *   "anuualfee_paid": true, 
 *   "isApproved": true, 
 *   "license_no": "test", 
 *   "payment_slip": "filename.jpg", 
 *   "created": "2022-01-01 10:00:00.123Z", 
 *   "updated": "2022-01-01 10:00:00.123Z" 
 * }
 */

// API base URL
const API_URL = 'http://145.223.21.62:8085/api/collections/driver/records';
const VEHICLES_API = `http://145.223.21.62:8085/api/collections/vehicle/records`;

const DriverApp = () => {
  // State for driver data
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'verified', 'approved', 'pending'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phonenumber: '',
    password: '',
    address: '',
    bday: '',
    isverified: false,
    isApproved: false,
    anuualfee_paid: false,
    license_no: '',
    onesignal_player_id: ''
  });

  // Function to fetch all drivers using Fetch API with pagination
const fetchDrivers = async () => {
  try {
    setLoading(true);
    
    // Initial variables for pagination
    let allDrivers = [];
    let page = 1;
    const perPage = 1000; // Fetch 100 records per request
    let hasMoreRecords = true;
    
    // Loop until all records are fetched
    while (hasMoreRecords) {
      const response = await fetch(`${API_URL}?page=${page}&perPage=${perPage}&sort=-created`);
      
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
    
    // Transform all collected drivers
    const transformedData = allDrivers.map(driver => ({
      id: driver.id,
      name: driver.name || '',
      email: driver.email || '',
      phonenumber: driver.phonenumber || '',
      address: driver.address || '',
      bday: driver.bday || '',
      isverified: driver.isverified || false,
      isApproved: driver.isApproved || false,
      photo: driver.photo || '',
      created: driver.created || '',
      updated: driver.updated || '',
      license_no: driver.license_no || '',
      anuualfee_paid: driver.anuualfee_paid || false,
      payment_slip: driver.payment_slip || '',
      onesignal_player_id: driver.onesignal_player_id || '',
      collectionId: driver.collectionId || '',
      collectionName: driver.collectionName || ''
    }));
    
    setDrivers(transformedData);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    setError('Failed to load drivers. Please try again later.');
  } finally {
    setLoading(false);
  }
};


// 2. Add a new state for vehicles in the DriverApp component
const [driverVehicles, setDriverVehicles] = useState({});

// 3. Create a function to fetch vehicles for a specific driver
const fetchDriverVehicles = async (driverId) => {
  try {
    // Use the filter parameter to get vehicles for this specific driver
    const response = await fetch(`${VEHICLES_API}?filter=(driver_id="${driverId}")`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items;
  } catch (err) {
    console.error(`Error fetching vehicles for driver ${driverId}:`, err);
    return [];
  }
};


  // Load drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Calculate statistics
  const stats = React.useMemo(() => {
    return {
      total: drivers.length,
      verified: drivers.filter(d => d.isverified).length,
      approved: drivers.filter(d => d.isApproved).length,
      pending: drivers.filter(d => !d.isverified).length,
      feePaid: drivers.filter(d => d.anuualfee_paid).length
    };
  }, [drivers]);

  // Filter drivers based on search term and status filter
  const filteredDrivers = drivers.filter(driver => {
    // Search term filter
    const matchesSearch = 
      (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.phonenumber && driver.phonenumber.toString().includes(searchTerm)) ||
      (driver.license_no && driver.license_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.address && driver.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'verified') {
      matchesStatus = driver.isverified;
    } else if (statusFilter === 'approved') {
      matchesStatus = driver.isApproved;
    } else if (statusFilter === 'pending') {
      matchesStatus = !driver.isverified;
    } else if (statusFilter === 'feepaid') {
      matchesStatus = driver.anuualfee_paid;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for creating or editing driver
  const openModal = (driver = null) => {
    if (driver) {
      // Edit mode - fill form with driver data
      setFormData({
        name: driver.name || '',
        email: driver.email || '',
        phonenumber: driver.phonenumber || '',
        password: '', // Don't populate password for security
        address: driver.address || '',
        bday: driver.bday ? driver.bday.split('T')[0] : '', // Format date for input
        isverified: driver.isverified || false,
        isApproved: driver.isApproved || false,
        license_no: driver.license_no || '',
        anuualfee_paid: driver.anuualfee_paid || false,
        onesignal_player_id: driver.onesignal_player_id || ''
      });
      setCurrentDriver(driver);
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        email: '',
        phonenumber: '',
        password: '',
        address: '',
        bday: '',
        isverified: false,
        isApproved: false,
        license_no: '',
        anuualfee_paid: false,
        onesignal_player_id: ''
      });
      setCurrentDriver(null);
    }
    setShowModal(true);
  };

  const viewDriverDetails = async (driver) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
    
    // Fetch vehicles for this driver
    const vehicles = await fetchDriverVehicles(driver.id);
    
    // Update the driverVehicles state with the fetched data
    setDriverVehicles(prev => ({
      ...prev,
      [driver.id]: vehicles
    }));
  };

  const getVehicleImageUrl = (vehicle, imageField) => {
    if (vehicle && vehicle[imageField]) {
      return `http://145.223.21.62:8085/api/files/${vehicle.collectionName || 'vehicle'}/${vehicle.id}/${vehicle[imageField]}`;
    }
    return null;
  };

  // Create or update driver using Fetch API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let url = API_URL;
      let method = 'POST';
      
      const submitData = {...formData};
      
      if (currentDriver) {
        // Update existing driver
        url = `${API_URL}/${currentDriver.id}`;
        method = 'PATCH';
        
        // If password is empty, remove it from the update data
        if (!submitData.password) {
          delete submitData.password;
        }
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Refresh the driver list
      fetchDrivers();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving driver:', err);
      alert(`Failed to save driver: ${err.message}`);
    }
  };

  // Delete driver using Fetch API
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        fetchDrivers();
      } catch (err) {
        console.error('Error deleting driver:', err);
        alert(`Failed to delete driver: ${err.message}`);
      }
    }
  };

  // Handle approve application (update verification status)
  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isverified: true,
          isApproved: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchDrivers();
    } catch (err) {
      console.error('Error approving driver:', err);
      alert(`Failed to approve driver: ${err.message}`);
    }
  };

  // Handle reject application (set isverified and isApproved to false)
  const handleReject = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isverified: false,
          isApproved: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchDrivers();
    } catch (err) {
      console.error('Error rejecting driver:', err);
      alert(`Failed to reject driver: ${err.message}`);
    }
  };

  // Update annual fee status
  const handleUpdateFeeStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anuualfee_paid: status
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetchDrivers();
    } catch (err) {
      console.error('Error updating fee status:', err);
      alert(`Failed to update fee status: ${err.message}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get avatar source or default to initials
  const getAvatarSource = (driver) => {
    if (driver.photo) {
      // If using PocketBase file storage, construct the URL
      return `http://145.223.21.62:8085/api/files/${driver.collectionName || 'driver'}/${driver.id}/${driver.photo}`;
    }
    return null;
  };

  // Get payment slip source
  const getPaymentSlipSource = (driver) => {
    if (driver.payment_slip) {
      // If using PocketBase file storage, construct the URL
      return `http://145.223.21.62:8085/api/files/${driver.collectionName || 'driver'}/${driver.id}/${driver.payment_slip}`;
    }
    return null;
  };

  // Driver form modal using uncontrolled inputs
  const DriverFormModal = () => {
    // Create form reference
    const formRef = React.useRef(null);
    
    // Handle form submission
    const handleFormSubmit = (e) => {
      e.preventDefault();
      
      // Get form data from the form elements
      const form = formRef.current;
      const submitData = {
        name: form.name.value,
        email: form.email.value,
        phonenumber: form.phonenumber.value,
        password: form.password.value,
        address: form.address.value,
        bday: form.bday.value,
        isverified: form.isverified.checked,
        isApproved: form.isApproved.checked,
        license_no: form.license_no.value,
        anuualfee_paid: form.anuualfee_paid.checked,
        onesignal_player_id: form.onesignal_player_id ? form.onesignal_player_id.value : ''
      };
      
      // If editing and password is empty, remove it
      if (currentDriver && !submitData.password) {
        delete submitData.password;
      }
      
      // Submit the data
      try {
        let url = API_URL;
        let method = 'POST';
        
        if (currentDriver) {
          url = `${API_URL}/${currentDriver.id}`;
          method = 'PATCH';
        }
        
        fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          fetchDrivers();
          setShowModal(false);
        })
        .catch(err => {
          console.error('Error saving driver:', err);
          alert(`Failed to save driver: ${err.message}`);
        });
      } catch (err) {
        console.error('Error saving driver:', err);
        alert(`Failed to save driver: ${err.message}`);
      }
    };

    return (
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{marginTop: 0}}>{currentDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
          
          <form ref={formRef} onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                defaultValue={currentDriver ? currentDriver.name || '' : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                defaultValue={currentDriver ? currentDriver.email || '' : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phonenumber"
                defaultValue={currentDriver ? currentDriver.phonenumber || '' : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="license_no"
                defaultValue={currentDriver ? currentDriver.license_no || '' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                defaultValue={currentDriver ? currentDriver.address || '' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Birth Date</label>
              <input
                type="date"
                name="bday"
                defaultValue={currentDriver && currentDriver.bday ? currentDriver.bday.split('T')[0] : ''}
              />
            </div>
            
            <div className="form-group">
              <label>OneSignal Player ID</label>
              <input
                type="text"
                name="onesignal_player_id"
                defaultValue={currentDriver ? currentDriver.onesignal_player_id || '' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Password {currentDriver && '(leave blank to keep unchanged)'}</label>
              <input
                type="password"
                name="password"
                defaultValue=""
                required={!currentDriver}
              />
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isverified"
                  defaultChecked={currentDriver ? currentDriver.isverified || false : false}
                />
                Verified Driver
              </label>
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isApproved"
                  defaultChecked={currentDriver ? currentDriver.isApproved || false : false}
                />
                Approved Driver
              </label>
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="anuualfee_paid"
                  defaultChecked={currentDriver ? currentDriver.anuualfee_paid || false : false}
                />
                Annual Fee Paid
              </label>
            </div>
            
            <div className="form-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: 'white',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button type="submit" className="primary" style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#4361ee',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                {currentDriver ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  
  // Add this function to handle photo clicks
  const handlePhotoClick = (driver, photoType) => {
    let photoUrl;
    if (photoType === 'profile') {
      photoUrl = getAvatarSource(driver);
    } else if (photoType === 'payment') {
      photoUrl = getPaymentSlipSource(driver);
    }
    
    if (!photoUrl) return;
    
    setPreviewPhoto({
      url: photoUrl,
      name: driver.name,
      type: photoType
    });
    setShowPhotoPreview(true);
    
    // Prevent the click from propagating to parent elements
    // which would trigger the viewDriverDetails function
    event.stopPropagation();
  };



  const PhotoPreviewModal = () => {
    if (!previewPhoto) return null;
    
    return (
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050 // Higher than other modals
      }} onClick={() => setShowPhotoPreview(false)}>
        <div className="photo-preview-content" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>
              {previewPhoto.name}'s {previewPhoto.type === 'profile' ? 'Profile Photo' : 'Payment Slip'}
            </h3>
            <button
              onClick={() => setShowPhotoPreview(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              &times;
            </button>
          </div>
          <div style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img
              src={previewPhoto.url}
              alt={`${previewPhoto.name}'s ${previewPhoto.type === 'profile' ? 'profile photo' : 'payment slip'}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
              }}
            />
          </div>
        </div>
      </div>
    );
  };


// Driver details modal with vehicle information
const DriverDetailsModal = () => {
  // State for tracking the selected vehicle tab (if driver has multiple vehicles)
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  
  // Get the vehicles for the current driver, or empty array if none
  const currentDriverVehicles = selectedDriver ? (driverVehicles[selectedDriver.id] || []) : [];
  
  if (!selectedDriver) return null;
  
  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h2 style={{margin: 0}}>Driver Details</h2>
          <button onClick={() => setShowDetailModal(false)} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}>&times;</button>
        </div>
        
        <div style={{padding: '20px', display: 'flex', borderBottom: '1px solid #eee'}}>
          <div style={{width: '120px', height: '120px', flexShrink: 0, marginRight: '20px'}}>
          {getAvatarSource(selectedDriver) ? (
            <img 
              src={getAvatarSource(selectedDriver)} 
              alt={selectedDriver.name} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoClick(selectedDriver, 'profile');
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#4361ee',
              borderRadius: '50%'
            }}>
              {selectedDriver.name ? selectedDriver.name.charAt(0) : '?'}
            </div>
          )}
          </div>
          
          <div>
            <h3 style={{marginTop: 0, marginBottom: '8px'}}>{selectedDriver.name}</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px'}}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: selectedDriver.isverified ? '#d1fae5' : '#fee2e2',
                color: selectedDriver.isverified ? '#047857' : '#b91c1c',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {selectedDriver.isverified ? 'Verified' : 'Not Verified'}
              </span>
              
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: selectedDriver.isApproved ? '#dbeafe' : '#fef3c7',
                color: selectedDriver.isApproved ? '#1e40af' : '#92400e',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {selectedDriver.isApproved ? 'Approved' : 'Not Approved'}
              </span>
              
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: selectedDriver.anuualfee_paid ? '#d1fae5' : '#fee2e2',
                color: selectedDriver.anuualfee_paid ? '#047857' : '#b91c1c',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {selectedDriver.anuualfee_paid ? 'Fee Paid' : 'Fee Not Paid'}
              </span>
            </div>
            
            <div style={{color: '#666'}}>ID: {selectedDriver.id}</div>
            <div style={{color: '#666', fontSize: '14px', marginTop: '5px'}}>
              Added: {formatDate(selectedDriver.created)}
            </div>
          </div>
        </div>
        
        <div style={{padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          <div className="info-block">
            <h4 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Contact Information</h4>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Email</div>
              <div>{selectedDriver.email || 'Not provided'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Phone Number</div>
              <div>{selectedDriver.phonenumber || 'Not provided'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Address</div>
              <div>{selectedDriver.address || 'Not provided'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Birth Date</div>
              <div>{formatDate(selectedDriver.bday) || 'Not provided'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>OneSignal Player ID</div>
              <div style={{wordBreak: 'break-all'}}>{selectedDriver.onesignal_player_id || 'Not provided'}</div>
            </div>
          </div>
          
          <div className="info-block">
            <h4 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Driver Details</h4>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>License Number</div>
              <div>{selectedDriver.license_no || 'Not provided'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Last Updated</div>
              <div>{formatDate(selectedDriver.updated) || 'Not available'}</div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{color: '#666', fontSize: '14px'}}>Payment Slip</div>
              <div>
              {getPaymentSlipSource(selectedDriver) ? (
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePhotoClick(selectedDriver, 'payment');
                  }}
                  style={{
                    display: 'inline-block',
                    padding: '5px 10px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#1f2937',
                    fontSize: '14px'
                  }}
                >
                  <FaFileInvoiceDollar style={{marginRight: '5px'}} />
                  View Payment Slip
                </a>
              ) : (
                'No payment slip uploaded'
              )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Vehicle Information Section */}
        {currentDriverVehicles && currentDriverVehicles.length > 0 ? (
          <div style={{padding: '20px', borderTop: '1px solid #eee'}}>
            <h4 style={{marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Vehicle Information</h4>
            
            {/* Vehicle Tabs if multiple vehicles */}
            {currentDriverVehicles.length > 1 && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px'
              }}>
                {currentDriverVehicles.map((vehicle, index) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setActiveVehicleIndex(index)}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      background: 'none',
                      borderBottom: index === activeVehicleIndex ? '2px solid #4361ee' : '2px solid transparent',
                      color: index === activeVehicleIndex ? '#1e293b' : '#64748b',
                      fontWeight: index === activeVehicleIndex ? '600' : '500',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {vehicle.vehicle_type || `Vehicle ${index + 1}`}
                  </button>
                ))}
              </div>
            )}
            
            {/* Active Vehicle Details */}
            {currentDriverVehicles[activeVehicleIndex] && (
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{color: '#64748b', fontSize: '14px', marginBottom: '4px'}}>Vehicle Type</div>
                    <div style={{fontWeight: '500'}}>{currentDriverVehicles[activeVehicleIndex].vehicle_type || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div style={{color: '#64748b', fontSize: '14px', marginBottom: '4px'}}>License Plate</div>
                    <div style={{fontWeight: '500'}}>{currentDriverVehicles[activeVehicleIndex].license_plate || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div style={{color: '#64748b', fontSize: '14px', marginBottom: '4px'}}>Vehicle Number</div>
                    <div style={{fontWeight: '500'}}>{currentDriverVehicles[activeVehicleIndex].vehicle_number || 'N/A'}</div>
                  </div>
                </div>
                
                {currentDriverVehicles[activeVehicleIndex].vehicle_details && (
                  <div style={{marginBottom: '20px'}}>
                    <div style={{color: '#64748b', fontSize: '14px', marginBottom: '4px'}}>Vehicle Details</div>
                    <div style={{
                      backgroundColor: '#fff',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {currentDriverVehicles[activeVehicleIndex].vehicle_details}
                    </div>
                  </div>
                )}
                
                {/* Vehicle Images */}
                <div>
                  <div style={{color: '#64748b', fontSize: '14px', marginBottom: '12px'}}>Vehicle Images</div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '16px'
                  }}>
                    {['image1', 'image2', 'image3', 'image4'].map((imageField, index) => (
                      currentDriverVehicles[activeVehicleIndex][imageField] ? (
                        <div key={index} style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          aspectRatio: '1',
                          cursor: 'pointer'
                        }} onClick={(e) => {
                          e.stopPropagation();
                          // Assuming you'll extend handlePhotoClick to handle vehicle images
                          handlePhotoClick(currentDriverVehicles[activeVehicleIndex], `vehicle_${index + 1}`);
                        }}>
                          <img 
                            src={`http://145.223.21.62:8085/api/files/vehicle/${currentDriverVehicles[activeVehicleIndex].id}/${currentDriverVehicles[activeVehicleIndex][imageField]}`}
                            alt={`Vehicle image ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                            }}
                          />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{padding: '20px', borderTop: '1px solid #eee'}}>
            <h4 style={{marginTop: 0, marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Vehicle Information</h4>
            <div style={{
              padding: '30px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              No vehicles registered for this driver
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
          <button 
            onClick={() => openModal(selectedDriver)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4361ee',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaEdit /> Edit
          </button>
          
          {!selectedDriver.isverified && (
            <button 
              onClick={() => {
                handleApprove(selectedDriver.id);
                setShowDetailModal(false);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaCheck /> Approve
            </button>
          )}
          
          {selectedDriver.isverified && (
            <button 
              onClick={() => {
                handleReject(selectedDriver.id);
                setShowDetailModal(false);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaTimes /> Revoke
            </button>
          )}
          
          <button 
            onClick={() => {
              handleUpdateFeeStatus(selectedDriver.id, !selectedDriver.anuualfee_paid);
              setShowDetailModal(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: selectedDriver.anuualfee_paid ? '#f59e0b' : '#10b981',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {selectedDriver.anuualfee_paid ? (
              <>
                <FaTimes /> Mark Fee Unpaid
              </>
            ) : (
              <>
                <FaCheck /> Mark Fee Paid
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="driver-app-container" style={{padding: '20px', backgroundColor: '#f9fafb'}}>
      <div className="driver-overview-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h1 style={{margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1e293b'}}>Driver Management</h1>
        
        <div className="header-actions" style={{display: 'flex', gap: '10px'}}>
          <div className="search-box" style={{
            position: 'relative',
            width: '300px'
          }}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input 
              type="text" 
              placeholder="Search drivers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{display: 'flex', gap: '8px'}}>
            <button
              className={statusFilter === 'all' ? 'active' : ''}
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? '#4361ee' : '#f3f4f6',
                color: statusFilter === 'all' ? 'white' : '#1f2937',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              className={statusFilter === 'verified' ? 'active' : ''}
              onClick={() => setStatusFilter('verified')}
              style={{
                background: statusFilter === 'verified' ? '#4361ee' : '#f3f4f6',
                color: statusFilter === 'verified' ? 'white' : '#1f2937',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Verified
            </button>
            <button
              className={statusFilter === 'approved' ? 'active' : ''}
              onClick={() => setStatusFilter('approved')}
              style={{
                background: statusFilter === 'approved' ? '#4361ee' : '#f3f4f6',
                color: statusFilter === 'approved' ? 'white' : '#1f2937',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Approved
            </button>
            <button
              className={statusFilter === 'pending' ? 'active' : ''}
              onClick={() => setStatusFilter('pending')}
              style={{
                background: statusFilter === 'pending' ? '#4361ee' : '#f3f4f6',
                color: statusFilter === 'pending' ? 'white' : '#1f2937',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Pending
            </button>
            <button
              className={statusFilter === 'feepaid' ? 'active' : ''}
              onClick={() => setStatusFilter('feepaid')}
              style={{
                background: statusFilter === 'feepaid' ? '#4361ee' : '#f3f4f6',
                color: statusFilter === 'feepaid' ? 'white' : '#1f2937',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Fee Paid
            </button>
          </div>
          
          <button 
            className="add-driver-btn"
            onClick={() => openModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <FaPlus /> Add Driver
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Drivers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>{stats.total}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Verified Drivers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>{stats.verified}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Approved Drivers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#4361ee' }}>{stats.approved}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Pending Approval</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Annual Fee Paid</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>{stats.feePaid}</div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px'
      }}>
        <div style={{display: 'flex', gap: '8px'}}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              background: viewMode === 'table' ? '#4361ee' : '#f3f4f6',
              color: viewMode === 'table' ? 'white' : '#1f2937',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('card')}
            style={{
              background: viewMode === 'card' ? '#4361ee' : '#f3f4f6',
              color: viewMode === 'card' ? 'white' : '#1f2937',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Card View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid #e5e7eb',
            borderTopColor: '#4361ee',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{marginLeft: '12px', color: '#6b7280'}}>Loading drivers...</span>
        </div>
      ) : error ? (
        <div className="error-message" style={{
          padding: '16px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          margin: '20px 0'
        }}>{error}</div>
      ) : (
        viewMode === 'table' ? (
          <div className="app-table-container" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <table className="app-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Driver Name</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Email</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Phone</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>License</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Status</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Fee</th>
                  <th style={{padding: '12px 16px', textAlign: 'left'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '32px 16px', color: '#6b7280'}}>
                      No drivers found. {searchTerm && 'Try a different search term.'}
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(driver => (
                    <tr key={driver.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                    {/* Driver Name Cell - Fixed Structure */}
<td className="driver-name-cell" style={{padding: '12px 16px', display: 'flex', alignItems: 'center'}}>
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '12px',
    flexShrink: 0,
    backgroundColor: '#4361ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    overflow: 'hidden'
  }}>
    {getAvatarSource(driver) ? (
      <img 
        src={getAvatarSource(driver)} 
        alt={driver.name || 'Driver'} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          handlePhotoClick(driver, 'profile');
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentNode.textContent = driver.name ? driver.name.charAt(0) : '?';
        }}
      />
    ) : (
      driver.name ? driver.name.charAt(0) : '?'
    )}
  </div>
  <div className="driver-info" style={{flexGrow: 1}}>
    <div className="name" style={{fontWeight: '500'}}>{driver.name || 'Unnamed Driver'}</div>
    <div className="created-date" style={{fontSize: '12px', color: '#6b7280'}}>Added: {formatDate(driver.created)}</div>
  </div>
</td>
                      <td style={{padding: '12px 16px'}}>{driver.email}</td>
                      <td style={{padding: '12px 16px'}}>{driver.phonenumber}</td>
                      <td style={{padding: '12px 16px'}}>{driver.license_no || '-'}</td>
                      <td style={{padding: '12px 16px'}}>
                        {driver.isverified && driver.isApproved ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#d1fae5',
                            color: '#047857',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>Verified & Approved</span>
                        ) : driver.isverified ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>Verified Only</span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>Pending</span>
                        )}
                      </td>
                      <td style={{padding: '12px 16px'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: driver.anuualfee_paid ? '#d1fae5' : '#fee2e2',
                          color: driver.anuualfee_paid ? '#047857' : '#b91c1c',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {driver.anuualfee_paid ? 'Paid' : 'Not Paid'}
                        </span>
                      </td>
                      <td className="actions-cell" style={{padding: '12px 16px'}}>
                        <div className="action-buttons" style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="btn-view" 
                            onClick={() => viewDriverDetails(driver)}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f3f4f6',
                              color: '#1f2937',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="btn-edit" 
                            onClick={() => openModal(driver)}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Edit Driver"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn-delete" 
                            onClick={() => handleDelete(driver.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Delete Driver"
                          >
                            <FaTrash />
                          </button>
                          {!driver.isverified && (
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApprove(driver.id)}
                              style={{
                                padding: '0 12px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#d1fae5',
                                color: '#047857',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '12px'
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {driver.isverified && (
                            <button 
                              className="btn-reject" 
                              onClick={() => handleReject(driver.id)}
                              style={{
                                padding: '0 12px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '12px'
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredDrivers.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                No drivers found. {searchTerm && 'Try a different search term.'}
              </div>
            ) : (
              filteredDrivers.map(driver => (
                <div 
                  key={driver.id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => viewDriverDetails(driver)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div style={{
                    height: '60px',
                    backgroundColor: '#4361ee',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      bottom: '-40px',
                      left: '20px',
                      border: '4px solid white',
                      overflow: 'hidden',
                      backgroundColor: '#4361ee'
                    }}>
                  {getAvatarSource(driver) ? (
  <img 
    src={getAvatarSource(driver)} 
    alt={driver.name} 
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%',
      cursor: 'pointer'
    }}
    onClick={(e) => {
      e.stopPropagation();
      handlePhotoClick(driver, 'profile');
    }}
  />
) : (
  <div style={{
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#4361ee',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold'
  }}>
    {driver.name ? driver.name.charAt(0) : '?'}
  </div>
)}

                    </div>
                  </div>
                  
                  <div style={{padding: '16px 16px 16px 110px', minHeight: '60px'}}>
                    <h3 style={{margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600'}}>{driver.name}</h3>
                    <div style={{fontSize: '14px', color: '#6b7280'}}>{driver.email}</div>
                    <div style={{fontSize: '14px', color: '#6b7280'}}>{driver.phonenumber}</div>
                  </div>
                  
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: driver.isverified ? '#d1fae5' : '#fee2e2',
                        color: driver.isverified ? '#047857' : '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {driver.isverified ? 'Verified' : 'Pending'}
                      </span>
                      
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: driver.anuualfee_paid ? '#d1fae5' : '#fee2e2',
                        color: driver.anuualfee_paid ? '#047857' : '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {driver.anuualfee_paid ? 'Fee Paid' : 'Fee Due'}
                      </span>
                    </div>
                    
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        className="btn-edit" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(driver);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Edit Driver"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}
      
      {/* Add keyframes for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {showPhotoPreview && <PhotoPreviewModal />}
      {showModal && <DriverFormModal />}
      {showDetailModal && selectedDriver && <DriverDetailsModal />}
    </div>
  );
};

export default DriverApp;