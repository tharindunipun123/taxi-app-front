import React, { useState, useEffect, memo, useCallback } from 'react';
import './CustomerView.css';
import { FaEllipsisV, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// API base URL
const API_URL = 'http://145.223.21.62:8085/api/collections/customer/records';

/**
 * PocketBase API Details:
 * GET /api/collections/customer/records/:id
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
 *   "collectionId": "pbc_3245856272", 
 *   "collectionName": "customer", 
 *   "id": "test", 
 *   "phonenumber": 123, 
 *   "password": "test", 
 *   "usertype": "test", 
 *   "photo": "filename.jpg", 
 *   "isverified": true, 
 *   "cover_photo": "filename.jpg", 
 *   "idnumber": "test", 
 *   "email": "test@example.com", 
 *   "full_name": "test", 
 *   "dob": "2022-01-01 10:00:00.123Z", 
 *   "onesignal_player_id": "test", 
 *   "created": "2022-01-01 10:00:00.123Z", 
 *   "updated": "2022-01-01 10:00:00.123Z" 
 * }
 */

const CustomerView = () => {
  // State for customers data
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phonenumber: '',
    password: '',
    usertype: 'customer',
    isverified: false,
    idnumber: ''
  });

  // Function to fetch customers using Fetch API
  // Function to fetch customers using Fetch API with pagination
const fetchCustomers = async () => {
  try {
    setLoading(true);
    
    // Initialize variables for pagination
    let allCustomers = [];
    let page = 1;
    const perPage = 100; // Fetch 100 records per request
    let hasMoreRecords = true;
    
    // Loop until all records are fetched
    while (hasMoreRecords) {
      const response = await fetch(`${API_URL}?page=${page}&perPage=${perPage}&sort=-created`);
      
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
    
    // Transform all collected customers
    const transformedData = allCustomers.map(record => ({
      id: record.id,
      full_name: record.full_name,
      email: record.email,
      phonenumber: record.phonenumber,
      usertype: record.usertype,
      isverified: record.isverified,
      idnumber: record.idnumber,
      photo: record.photo,
      cover_photo: record.cover_photo,
      dob: record.dob,
      onesignal_player_id: record.onesignal_player_id,
      created: record.created,
      updated: record.updated,
      collectionId: record.collectionId,
      collectionName: record.collectionName,
      avatar: record.full_name ? record.full_name.split(' ').map(n => n[0]).join('') : 'U',
      avatarColor: generateColor(record.id)
    }));
    
    setCustomers(transformedData);
  } catch (err) {
    console.error('Error fetching customers:', err);
    setError('Failed to load customers. Please try again later.');
  } finally {
    setLoading(false);
  }
};

  // Function to get a single customer with expanded relations
  const fetchSingleCustomer = async (id) => {
    try {
      // Use PocketBase API expand parameter to get all related fields
      const response = await fetch(`${API_URL}/${id}?expand=*`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const record = await response.json();
      return record;
    } catch (err) {
      console.error(`Error fetching customer with ID ${id}:`, err);
      throw err;
    }
  };

  // Function to generate a consistent color based on customer ID
  const generateColor = (id) => {
    const colors = ['#4ecdc4', '#ff6b6b', '#ffe66d', '#1a535c', '#4f6367', '#7a9e9f'];
    const index = parseInt(id, 16) % colors.length;
    return colors[index] || '#4ecdc4';
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phonenumber && customer.phonenumber.toString().includes(searchTerm)) ||
    (customer.idnumber && customer.idnumber.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.usertype && customer.usertype.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Stats for dashboard overview
  const stats = React.useMemo(() => {
    return {
      total: customers.length,
      verified: customers.filter(c => c.isverified).length,
      adminUsers: customers.filter(c => c.usertype === 'admin').length,
      driverUsers: customers.filter(c => c.usertype === 'driver').length,
      customerUsers: customers.filter(c => c.usertype === 'customer' || !c.usertype).length,
      withPhotos: customers.filter(c => c.photo || c.cover_photo).length
    };
  }, [customers]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Open modal for creating or editing customer
  const openModal = (customer = null) => {
    if (customer) {
      // Edit mode - fill form with customer data
      // Map all fields from the API response schema
      setFormData({
        full_name: customer.full_name,
        email: customer.email,
        phonenumber: customer.phonenumber,
        usertype: customer.usertype || 'customer',
        isverified: customer.isverified || false,
        idnumber: customer.idnumber || '',
        dob: customer.dob || '',
        onesignal_player_id: customer.onesignal_player_id || '',
        // Photo and cover_photo are handled separately since they're files
        // Don't populate password for security reasons
        password: ''
      });
      setCurrentCustomer(customer);
    } else {
      // Create mode - reset form
      setFormData({
        full_name: '',
        email: '',
        phonenumber: '',
        password: '',
        usertype: 'customer',
        isverified: false,
        idnumber: '',
        dob: '',
        onesignal_player_id: ''
      });
      setCurrentCustomer(null);
    }
    setShowModal(true);
  };

  // Create or update customer using Fetch API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let url = API_URL;
      let method = 'POST';
      
      const submitData = {...formData};
      
      if (currentCustomer) {
        // Update existing customer
        url = `${API_URL}/${currentCustomer.id}`;
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
      
      // Refresh the customer list
      fetchCustomers();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      alert(`Failed to save customer: ${err.message}`);
    }
  };

  // Delete customer using Fetch API
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert(`Failed to delete customer: ${err.message}`);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };


const [showPhotoPreview, setShowPhotoPreview] = useState(false);
const [previewPhoto, setPreviewPhoto] = useState(null);

// Add this function to handle photo clicks
const handlePhotoClick = (customer, photoType) => {
  const photoUrl = `http://145.223.21.62:8085/api/files/${customer.collectionId}/${customer.id}/${photoType === 'profile' ? customer.photo : customer.cover_photo}`;
  setPreviewPhoto({
    url: photoUrl,
    name: customer.full_name,
    type: photoType
  });
  setShowPhotoPreview(true);
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
      zIndex: 1000
    }} onClick={() => setShowPhotoPreview(false)}>
      <div className="photo-preview-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '80%',
        maxHeight: '80%',
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
            {previewPhoto.name}'s {previewPhoto.type === 'profile' ? 'Profile Photo' : 'Cover Photo'}
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
            alt={`${previewPhoto.name}'s ${previewPhoto.type} photo`}
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

  // Action menu for each customer
  const CustomerActions = ({ customer }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    return (
      <div style={{ 
        position: 'relative',
        display: 'inline-block'
      }}>
        <button 
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s'
          }}
          onClick={() => setShowMenu(!showMenu)}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FaEllipsisV />
        </button>
        
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
            minWidth: '150px',
            overflow: 'hidden'
          }}>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#475569',
                borderBottom: '1px solid #f1f5f9'
              }}
              onClick={() => openModal(customer)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <FaEdit style={{ color: '#3b82f6' }} /> Edit
            </button>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#475569'
              }}
              onClick={() => handleDelete(customer.id)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <FaTrash style={{ color: '#ef4444' }} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // Customer form modal
  const CustomerModal = () => {
    // Create form reference
    const formRef = React.useRef(null);
    
    // Handle form submission
    const handleFormSubmit = (e) => {
      e.preventDefault();
      
      // Get form data from the form elements
      const form = formRef.current;
      
      // Create submitData object mapping to PocketBase API fields
      const submitData = {
        full_name: form.full_name.value,
        email: form.email.value,
        phonenumber: form.phonenumber.value,
        idnumber: form.idnumber.value,
        password: form.password.value,
        usertype: form.usertype.value,
        isverified: form.isverified.checked
      };
      
      // Add date of birth if present in the form
      if (form.dob && form.dob.value) {
        submitData.dob = form.dob.value;
      }
      
      // Add OneSignal player ID if present in the form
      if (form.onesignal_player_id && form.onesignal_player_id.value) {
        submitData.onesignal_player_id = form.onesignal_player_id.value;
      }
      
      // Submit the data
      try {
        let url = API_URL;
        let method = 'POST';
        
        if (currentCustomer) {
          url = `${API_URL}/${currentCustomer.id}`;
          method = 'PATCH';
          
          // If password is empty, remove it from the update data
          if (!submitData.password) {
            delete submitData.password;
          }
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
          fetchCustomers();
          setShowModal(false);
        })
        .catch(err => {
          console.error('Error saving customer:', err);
          alert(`Failed to save customer: ${err.message}`);
        });
      } catch (err) {
        console.error('Error saving customer:', err);
        alert(`Failed to save customer: ${err.message}`);
      }
    };

    return (
      <div className="modal-backdrop">
        <div className="modal-content">
          <h2>{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
          
          <form ref={formRef} onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                defaultValue={currentCustomer ? currentCustomer.full_name : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                defaultValue={currentCustomer ? currentCustomer.email : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phonenumber"
                defaultValue={currentCustomer ? currentCustomer.phonenumber : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>ID Number</label>
              <input
                type="text"
                name="idnumber"
                defaultValue={currentCustomer ? currentCustomer.idnumber || '' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                defaultValue={currentCustomer && currentCustomer.dob ? new Date(currentCustomer.dob).toISOString().split('T')[0] : ''}
              />
            </div>
            
            <div className="form-group">
              <label>OneSignal Player ID</label>
              <input
                type="text"
                name="onesignal_player_id"
                defaultValue={currentCustomer ? currentCustomer.onesignal_player_id || '' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Password {currentCustomer && '(leave blank to keep unchanged)'}</label>
              <input
                type="password"
                name="password"
                defaultValue=""
                required={!currentCustomer}
              />
            </div>
            
            <div className="form-group">
              <label>User Type</label>
              <select
                name="usertype"
                defaultValue={currentCustomer ? currentCustomer.usertype || 'customer' : 'customer'}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isverified"
                  defaultChecked={currentCustomer ? currentCustomer.isverified || false : false}
                />
                Verified Account
              </label>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {currentCustomer ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Add keyframes for the spinner animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="customer-view-container" style={{ padding: '20px', backgroundColor: '#f9fafb' }}>
      <div className="customer-overview-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1e293b', 
          margin: 0 
        }}>Customer Overview</h1>
        
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#3b82f6' : '#f1f5f9',
                color: viewMode === 'table' ? 'white' : '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#3b82f6' : '#f1f5f9',
                color: viewMode === 'grid' ? 'white' : '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}
            >
              Card View
            </button>
          </div>
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
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Customers</div>
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
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Verified Accounts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>{stats.verified}</div>
        </div>
        
        {/* <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Admin Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>{stats.adminUsers}</div>
        </div> */}
        
        {/* <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Driver Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>{stats.driverUsers}</div>
        </div> */}
        
        {/* <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Customer Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#047857' }}>{stats.customerUsers}</div>
        </div> */}
        
        {/* <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>With Photos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#8b5cf6' }}>{stats.withPhotos}</div>
        </div> */}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ 
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          Loading customers...
        </div>
      ) : error ? (
        <div className="error-message" style={{ 
          padding: '20px', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          {error}
        </div>
      ) : (
        <>
          {filteredCustomers.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              color: '#64748b'
            }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ margin: '0 auto 16px', color: '#94a3b8' }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: '0' }}>
                No customers found. {searchTerm && 'Try a different search term.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="customer-table-container" style={{ overflowX: 'auto' }}>
              <table className="customer-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="name-column" style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>ID Number</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>User Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Verified</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date of Birth</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>OneSignal ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Photos</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Updated</th>
                    <th className="actions-column" style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td className="name-cell" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="customer-avatar" style={{ 
                          backgroundColor: customer.avatarColor,
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {customer.photo ? (
  <img 
    src={`http://145.223.21.62:8085/api/files/${customer.collectionId}/${customer.id}/${customer.photo}`}
    alt="Profile"
    style={{ 
      width: '100%', 
      height: '100%', 
      borderRadius: '50%', 
      objectFit: 'cover',
      cursor: 'pointer' 
    }}
    onClick={() => handlePhotoClick(customer, 'profile')}
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentNode.textContent = customer.avatar;
    }}
  />
) : (
  customer.avatar
)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{customer.full_name}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{customer.email}</td>
                      <td style={{ padding: '12px 16px' }}>{customer.phonenumber || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>{customer.idnumber || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: 
                              customer.usertype === 'admin' ? '#fee2e2' : 
                              customer.usertype === 'driver' ? '#e0f2fe' : 
                              '#f0fdf4',
                            color: 
                              customer.usertype === 'admin' ? '#b91c1c' : 
                              customer.usertype === 'driver' ? '#0369a1' : 
                              '#166534',
                            textTransform: 'capitalize'
                          }}
                        >
                          {customer.usertype || 'customer'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: customer.isverified ? '#f0fdf4' : '#fef2f2',
                          color: customer.isverified ? '#166534' : '#b91c1c'
                        }}>
                          {customer.isverified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{customer.dob ? formatDate(customer.dob).split(' ')[0] : '-'}</td>
                      <td style={{ padding: '12px 16px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.onesignal_player_id ? 
                          <span title={customer.onesignal_player_id}>
                            {customer.onesignal_player_id.substring(0, 10)}...
                          </span> : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {(customer.photo || customer.cover_photo) ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {customer.photo && (
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  backgroundColor: '#10b981' 
                                }} 
                                title="Has profile photo"
                              ></span>
                            )}
                            {customer.cover_photo && (
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  backgroundColor: '#3b82f6' 
                                }} 
                                title="Has cover photo"
                              ></span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{formatDate(customer.created)}</td>
                      <td style={{ padding: '12px 16px' }}>{formatDate(customer.updated)}</td>
                      <td className="actions-cell" style={{ padding: '12px 16px' }}>
                        <CustomerActions customer={customer} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px', 
              padding: '20px 0'
            }}>
              {filteredCustomers.map(customer => (
                <div key={customer.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                >
                  <div style={{ 
                    backgroundColor: customer.cover_photo ? 'transparent' : '#f8fafc',
                    height: '80px',
                    position: 'relative'
                  }}>
                    {customer.cover_photo && (
  <img 
    src={`http://145.223.21.62:8085/api/files/${customer.collectionId}/${customer.id}/${customer.cover_photo}`}
    alt="Cover"
    style={{ 
      width: '100%', 
      height: '100%', 
      objectFit: 'cover',
      cursor: 'pointer' 
    }}
    onClick={() => handlePhotoClick(customer, 'cover')}
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentNode.style.backgroundColor = '#f8fafc';
    }}
  />
)}
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-30px', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: customer.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      border: '3px solid white'
                    }}>
                     {customer.photo ? (
  <img 
    src={`http://145.223.21.62:8085/api/files/${customer.collectionId}/${customer.id}/${customer.photo}`}
    alt="Profile"
    style={{ 
      width: '100%', 
      height: '100%', 
      borderRadius: '50%', 
      objectFit: 'cover',
      cursor: 'pointer' 
    }}
    onClick={() => handlePhotoClick(customer, 'profile')}
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentNode.textContent = customer.avatar;
    }}
  />
) : (
  customer.avatar
)}

                    </div>
                  </div>
                  
                  <div style={{ padding: '40px 20px 20px', textAlign: 'center' }}>
                    <h3 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      marginBottom: '4px', 
                      color: '#1e293b'
                    }}>
                      {customer.full_name}
                    </h3>
                    
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      marginBottom: '16px' 
                    }}>
                      {customer.email}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: 
                          customer.usertype === 'admin' ? '#fee2e2' : 
                          customer.usertype === 'driver' ? '#e0f2fe' : 
                          '#f0fdf4',
                        color: 
                          customer.usertype === 'admin' ? '#b91c1c' : 
                          customer.usertype === 'driver' ? '#0369a1' : 
                          '#166534',
                        textTransform: 'capitalize'
                      }}>
                        {customer.usertype || 'customer'}
                      </span>
                      
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: customer.isverified ? '#f0fdf4' : '#fef2f2',
                        color: customer.isverified ? '#166534' : '#b91c1c'
                      }}>
                        {customer.isverified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {customer.phonenumber && (
                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                          <span style={{ color: '#64748b', marginRight: '8px', fontWeight: '500' }}>Phone:</span>
                          {customer.phonenumber}
                        </div>
                      )}
                      
                      {customer.idnumber && (
                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                          <span style={{ color: '#64748b', marginRight: '8px', fontWeight: '500' }}>ID:</span>
                          {customer.idnumber}
                        </div>
                      )}
                      
                      {customer.dob && (
                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                          <span style={{ color: '#64748b', marginRight: '8px', fontWeight: '500' }}>DoB:</span>
                          {formatDate(customer.dob).split(' ')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '12px 20px',
                    borderTop: '1px solid #e2e8f0', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Created: {formatDate(customer.created).split(' ')[0]}
                    </div>
                    
                    <CustomerActions customer={customer} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showPhotoPreview && <PhotoPreviewModal />}
      
      {showModal && <CustomerModal />}
    </div>
  );
};

const CustomerForm = memo(({ formData, handleInputChange, currentCustomer, handleSubmit, setShowModal }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="text"
          name="phonenumber"
          value={formData.phonenumber}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>ID Number</label>
        <input
          type="text"
          name="idnumber"
          value={formData.idnumber}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label>Date of Birth</label>
        <input
          type="date"
          name="dob"
          value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label>OneSignal Player ID</label>
        <input
          type="text"
          name="onesignal_player_id"
          value={formData.onesignal_player_id || ''}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label>Password {currentCustomer && '(leave blank to keep unchanged)'}</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required={!currentCustomer}
        />
      </div>
      
      <div className="form-group">
        <label>User Type</label>
        <select
          name="usertype"
          value={formData.usertype}
          onChange={handleInputChange}
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="driver">Driver</option>
        </select>
      </div>
      
      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="isverified"
            checked={formData.isverified}
            onChange={handleInputChange}
          />
          Verified Account
        </label>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={() => setShowModal(false)}>
          Cancel
        </button>
        <button type="submit" className="primary">
          {currentCustomer ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
});

export default CustomerView;