import React, { useState, useEffect } from 'react';
import './Vehicles.css';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';

// API base URLs
const VEHICLE_TYPES_API = 'http://145.223.21.62:8085/api/collections/vehicle_types/records';
const VEHICLE_MODELS_API = 'http://145.223.21.62:8085/api/collections/vehicle_models/records';

const Vehicles = () => {
  // State for vehicle data
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);

  // Form data
  const [vehicleForm, setVehicleForm] = useState({
    model: '',
    licensePlate: '',
    year: new Date().getFullYear().toString(),
    type: '',
    category: '',
    status: 'Active'
  });

  const [typeForm, setTypeForm] = useState({
    name: ''
  });

  const [modelForm, setModelForm] = useState({
    name: '',
    type_id: ''
  });

  // Fetch vehicle types (categories)
  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch(`${VEHICLE_TYPES_API}?sort=name`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setVehicleTypes(data.items);
      return data.items;
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
      setError('Failed to load vehicle categories.');
      return [];
    }
  };

  // Fetch vehicle models (subcategories)
  const fetchVehicleModels = async () => {
    try {
      const response = await fetch(`${VEHICLE_MODELS_API}?expand=type_id&sort=name`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setVehicleModels(data.items);
      return data.items;
    } catch (err) {
      console.error('Error fetching vehicle models:', err);
      setError('Failed to load vehicle models.');
      return [];
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const types = await fetchVehicleTypes();
        const models = await fetchVehicleModels();
        
        // For demo purposes, we'll create some sample vehicles
        // In a real app, you'd have a separate vehicle collection
        const sampleVehicles = [
          {
            id: 1,
            model: models.length > 0 ? models[0].name : 'Sample Model',
            licensePlate: 'ABC 123',
            year: '2023',
            type: types.length > 0 ? types[0].name : 'Sample Type',
            category: 'Premium',
            status: 'Active'
          },
          {
            id: 2,
            model: models.length > 1 ? models[1].name : 'Sample Model 2',
            licensePlate: 'XYZ 789',
            year: '2022',
            type: types.length > 0 ? types[0].name : 'Sample Type',
            category: 'Standard',
            status: 'Active'
          }
        ];
        
        setVehicles(sampleVehicles);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to initialize data.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form handlers
  const handleVehicleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm({
      ...vehicleForm,
      [name]: value
    });
  };

  const handleTypeInputChange = (e) => {
    const { name, value } = e.target;
    setTypeForm({
      ...typeForm,
      [name]: value
    });
  };

  const handleModelInputChange = (e) => {
    const { name, value } = e.target;
    setModelForm({
      ...modelForm,
      [name]: value
    });
  };

  // Type (Category) CRUD operations
  const openTypeModal = (type = null) => {
    if (type) {
      setTypeForm({
        name: type.name
      });
      setCurrentType(type);
    } else {
      setTypeForm({
        name: ''
      });
      setCurrentType(null);
    }
    setShowTypeModal(true);
  };

  const submitTypeForm = async (e) => {
    e.preventDefault();
    try {
      let url = VEHICLE_TYPES_API;
      let method = 'POST';
      
      if (currentType) {
        url = `${VEHICLE_TYPES_API}/${currentType.id}`;
        method = 'PATCH';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(typeForm)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      await fetchVehicleTypes();
      setShowTypeModal(false);
    } catch (err) {
      console.error('Error saving vehicle type:', err);
      alert(`Failed to save vehicle category: ${err.message}`);
    }
  };

  const deleteType = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle category? This will also delete all related models.')) {
      try {
        const response = await fetch(`${VEHICLE_TYPES_API}/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        await fetchVehicleTypes();
        await fetchVehicleModels();
      } catch (err) {
        console.error('Error deleting vehicle type:', err);
        alert(`Failed to delete vehicle category: ${err.message}`);
      }
    }
  };

  // Model (Subcategory) CRUD operations
  const openModelModal = (model = null) => {
    if (model) {
      setModelForm({
        name: model.name,
        type_id: model.type_id
      });
      setCurrentModel(model);
    } else {
      setModelForm({
        name: '',
        type_id: vehicleTypes.length > 0 ? vehicleTypes[0].id : ''
      });
      setCurrentModel(null);
    }
    setShowModelModal(true);
  };

  const submitModelForm = async (e) => {
    e.preventDefault();
    try {
      let url = VEHICLE_MODELS_API;
      let method = 'POST';
      
      if (currentModel) {
        url = `${VEHICLE_MODELS_API}/${currentModel.id}`;
        method = 'PATCH';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modelForm)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      await fetchVehicleModels();
      setShowModelModal(false);
    } catch (err) {
      console.error('Error saving vehicle model:', err);
      alert(`Failed to save vehicle model: ${err.message}`);
    }
  };

  const deleteModel = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle model?')) {
      try {
        const response = await fetch(`${VEHICLE_MODELS_API}/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        await fetchVehicleModels();
      } catch (err) {
        console.error('Error deleting vehicle model:', err);
        alert(`Failed to delete vehicle model: ${err.message}`);
      }
    }
  };

  // Vehicle CRUD operations
  const openVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setVehicleForm({
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        year: vehicle.year,
        type: vehicle.type,
        category: vehicle.category,
        status: vehicle.status
      });
      setCurrentVehicle(vehicle);
    } else {
      setVehicleForm({
        model: vehicleModels.length > 0 ? vehicleModels[0].name : '',
        licensePlate: '',
        year: new Date().getFullYear().toString(),
        type: vehicleTypes.length > 0 ? vehicleTypes[0].name : '',
        category: 'Standard',
        status: 'Active'
      });
      setCurrentVehicle(null);
    }
    setShowVehicleModal(true);
  };

  const submitVehicleForm = (e) => {
    e.preventDefault();
    
    // For demo purposes, we'll just update the local state
    // In a real app, you'd send this to your API
    if (currentVehicle) {
      // Edit existing vehicle
      const updatedVehicles = vehicles.map(v => 
        v.id === currentVehicle.id ? { ...v, ...vehicleForm } : v
      );
      setVehicles(updatedVehicles);
    } else {
      // Add new vehicle
      const newVehicle = {
        id: Date.now(), // temporary ID for demo
        ...vehicleForm
      };
      setVehicles([...vehicles, newVehicle]);
    }
    
    setShowVehicleModal(false);
  };

  const deleteVehicle = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      const updatedVehicles = vehicles.filter(v => v.id !== id);
      setVehicles(updatedVehicles);
    }
  };

  // Modal components
  const VehicleModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{currentVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
        
        <form onSubmit={submitVehicleForm}>
          <div className="form-group">
            <label>Model</label>
            <select
              name="model"
              value={vehicleForm.model}
              onChange={handleVehicleInputChange}
              required
            >
              {vehicleModels.map(model => (
                <option key={model.id} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>License Plate</label>
            <input
              type="text"
              name="licensePlate"
              value={vehicleForm.licensePlate}
              onChange={handleVehicleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Year</label>
            <input
              type="text"
              name="year"
              value={vehicleForm.year}
              onChange={handleVehicleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={vehicleForm.type}
              onChange={handleVehicleInputChange}
              required
            >
              {vehicleTypes.map(type => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={vehicleForm.category}
              onChange={handleVehicleInputChange}
              required
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Luxury">Luxury</option>
              <option value="Economy">Economy</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={vehicleForm.status}
              onChange={handleVehicleInputChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowVehicleModal(false)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              {currentVehicle ? 'Update' : 'Add'} Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const TypeModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{currentType ? 'Edit Vehicle Category' : 'Add New Vehicle Category'}</h2>
        
        <form onSubmit={submitTypeForm}>
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              name="name"
              value={typeForm.name}
              onChange={handleTypeInputChange}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowTypeModal(false)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              {currentType ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ModelModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{currentModel ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}</h2>
        
        <form onSubmit={submitModelForm}>
          <div className="form-group">
            <label>Model Name</label>
            <input
              type="text"
              name="name"
              value={modelForm.name}
              onChange={handleModelInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Vehicle Category</label>
            <select
              name="type_id"
              value={modelForm.type_id}
              onChange={handleModelInputChange}
              required
            >
              {vehicleTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowModelModal(false)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              {currentModel ? 'Update' : 'Add'} Model
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="vehicles-container">
      {/* Main Header */}
      <div className="vehicles-header">
        <h1>Vehicle Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search vehicles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories and Models Section */}
      <div className="categories-section">
        <div className="category-header">
          <h2>Vehicle Categories</h2>
          <button className="add-btn" onClick={() => openTypeModal()}>
            <FaPlus />
            <span>Add Category</span>
          </button>
        </div>
        
        <div className="categories-container">
          {vehicleTypes.map(type => (
            <div key={type.id} className="category-card">
              <div className="category-card-header">
                <h3>{type.name}</h3>
                <div className="card-actions">
                  <button className="edit-btn" onClick={() => openTypeModal(type)}>
                    <FaEdit />
                  </button>
                  <button className="delete-btn" onClick={() => deleteType(type.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="subcategories">
                <h4>Models</h4>
                <ul>
                  {vehicleModels
                    .filter(model => model.type_id === type.id)
                    .map(model => (
                      <li key={model.id}>
                        {model.name}
                        <div className="model-actions">
                          <button className="edit-btn-small" onClick={() => openModelModal(model)}>
                            <FaEdit />
                          </button>
                          <button className="delete-btn-small" onClick={() => deleteModel(model.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
                <button 
                  className="add-model-btn"
                  onClick={() => {
                    setModelForm({ name: '', type_id: type.id });
                    setCurrentModel(null);
                    setShowModelModal(true);
                  }}
                >
                  <FaPlus /> Add Model
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="vehicles-section">
        <h2>Vehicles</h2>
        {loading ? (
          <div className="loading">Loading vehicles...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="vehicles-table-container">
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Vehicle Model</th>
                  <th>License Plate</th>
                  <th>Year</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-results">
                      No vehicles found. {searchTerm && 'Try a different search term.'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.licensePlate}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.type}</td>
                      <td>{vehicle.category}</td>
                      <td>
                        <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="edit-btn" 
                          onClick={() => openVehicleModal(vehicle)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => deleteVehicle(vehicle.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showVehicleModal && <VehicleModal />}
      {showTypeModal && <TypeModal />}
      {showModelModal && <ModelModal />}
    </div>
  );
};

export default Vehicles;










// import React, { useState } from 'react';
// import './Vehicles.css';
// import { FaPlus } from 'react-icons/fa';

// const Vehicles = () => {
//   // Sample vehicles data - in a real app, you'd fetch this from an API
//   const [vehicles, setVehicles] = useState([
//     {
//       id: 1,
//       model: 'Toyota Camry',
//       licensePlate: 'ABC 123',
//       year: '2021',
//       type: 'Sedan',
//       category: 'Premium',
//       status: 'Active'
//     },
//     {
//       id: 2,
//       model: 'Honda Civic',
//       licensePlate: 'XYZ 789',
//       year: '2022',
//       type: 'Sedan',
//       category: 'Standard',
//       status: 'Active'
//     }
//   ]);

//   // Handle adding a new vehicle
//   const handleAddVehicle = () => {
//     console.log('Adding new vehicle');
//     // In a real app, this would open a form or modal
//   };

//   // Handle editing a vehicle
//   const handleEdit = (id) => {
//     console.log(`Editing vehicle ${id}`);
//     // In a real app, this would open a form or modal with the vehicle data
//   };

//   return (
//     <div className="vehicles-container">
//       <div className="vehicles-header">
//         <h1>Vehicles</h1>
//         <button className="add-vehicle-btn" onClick={handleAddVehicle}>
//           <FaPlus />
//           <span>Add Vehicle</span>
//         </button>
//       </div>

//       <div className="vehicles-table-container">
//         <table className="vehicles-table">
//           <thead>
//             <tr>
//               <th>Vehicle Model</th>
//               <th>License Plate</th>
//               <th>Year</th>
//               <th>Type</th>
//               <th>Category</th>
//               <th>Status</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {vehicles.map((vehicle) => (
//               <tr key={vehicle.id}>
//                 <td>{vehicle.model}</td>
//                 <td>{vehicle.licensePlate}</td>
//                 <td>{vehicle.year}</td>
//                 <td>{vehicle.type}</td>
//                 <td>{vehicle.category}</td>
//                 <td>
//                   <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
//                     {vehicle.status}
//                   </span>
//                 </td>
//                 <td>
//                   <button 
//                     className="edit-btn" 
//                     onClick={() => handleEdit(vehicle.id)}
//                   >
//                     Edit
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Vehicles;