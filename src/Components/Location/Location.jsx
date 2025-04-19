import React, { useState } from 'react';
import './Location.css';
import { FaPlus } from 'react-icons/fa';

const Location = () => {
  // Sample locations data - in a real app, you'd fetch this from an API
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: 'Central Station',
      address: '123 Main Street',
      city: 'New York',
      type: 'Transport Hub',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Airport Terminal 1',
      address: 'JFK Airport',
      city: 'New York',
      type: 'Airport',
      status: 'Active'
    }
  ]);

  // Handle adding a new location
  const handleAddLocation = () => {
    console.log('Adding new location');
    // In a real app, this would open a form or modal
  };

  // Handle editing a location
  const handleEdit = (id) => {
    console.log(`Editing location ${id}`);
    // In a real app, this would open a form or modal with the location data
  };

  return (
    <div className="locations-container">
      <div className="locations-header">
        <h1>Locations</h1>
        <button className="add-location-btn" onClick={handleAddLocation}>
          <FaPlus />
          <span>Add Location</span>
        </button>
      </div>

      <div className="locations-table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>Location Name</th>
              <th>Address</th>
              <th>City</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td>{location.name}</td>
                <td>{location.address}</td>
                <td>{location.city}</td>
                <td>{location.type}</td>
                <td>
                  <span className={`status-badge ${location.status.toLowerCase()}`}>
                    {location.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(location.id)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Location;