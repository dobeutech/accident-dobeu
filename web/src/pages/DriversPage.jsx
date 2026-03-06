import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/api';
import toast from 'react-hot-toast';

function DriverForm({ onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Driver</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverService.getAll()
  });

  const createMutation = useMutation({
    mutationFn: (data) => driverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver created');
      setShowForm(false);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to create driver')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => driverService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver updated');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to update driver')
  });

  const drivers = data?.data?.drivers || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Drivers</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Driver
        </button>
      </div>

      {isLoading ? (
        <p>Loading drivers...</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    No drivers found. Click "Add Driver" to create one.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>{driver.first_name} {driver.last_name}</td>
                    <td>{driver.email}</td>
                    <td>{driver.phone || '-'}</td>
                    <td>
                      <span className={`status-badge ${driver.is_active ? 'active' : 'inactive'}`}>
                        {driver.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{driver.last_login ? new Date(driver.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <button
                        className="btn-small"
                        onClick={() => toggleMutation.mutate({ id: driver.id, is_active: !driver.is_active })}
                      >
                        {driver.is_active ? 'Deactivate' : 'Activate'}
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
        <DriverForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}
