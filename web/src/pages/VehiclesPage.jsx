import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/api';
import toast from 'react-hot-toast';

function VehicleForm({ onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    vehicle_number: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.year) data.year = parseInt(data.year);
    else delete data.year;
    onSubmit(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Vehicle</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vehicle Number</label>
            <input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Make</label>
            <input name="make" value={form.make} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input name="model" value={form.model} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input name="year" type="number" min="1900" max="2100" value={form.year} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>VIN</label>
            <input name="vin" value={form.vin} onChange={handleChange} maxLength={17} />
          </div>
          <div className="form-group">
            <label>License Plate</label>
            <input name="license_plate" value={form.license_plate} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getAll()
  });

  const createMutation = useMutation({
    mutationFn: (data) => vehicleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success('Vehicle added');
      setShowForm(false);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to add vehicle')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => vehicleService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success('Vehicle updated');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to update vehicle')
  });

  const vehicles = data?.data?.vehicles || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vehicles</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Vehicle
        </button>
      </div>

      {isLoading ? (
        <p>Loading vehicles...</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Vehicle #</th>
                <th>Make / Model</th>
                <th>Year</th>
                <th>License Plate</th>
                <th>VIN</th>
                <th>Current Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    No vehicles found. Click "Add Vehicle" to create one.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.vehicle_number}</td>
                    <td>{[v.make, v.model].filter(Boolean).join(' ') || '-'}</td>
                    <td>{v.year || '-'}</td>
                    <td>{v.license_plate || '-'}</td>
                    <td>{v.vin || '-'}</td>
                    <td>
                      {v.driver_first_name
                        ? `${v.driver_first_name} ${v.driver_last_name}`
                        : 'Unassigned'}
                    </td>
                    <td>
                      <span className={`status-badge ${v.is_active ? 'active' : 'inactive'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-small"
                        onClick={() => toggleMutation.mutate({ id: v.id, is_active: !v.is_active })}
                      >
                        {v.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <VehicleForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}
