import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formConfigService } from '../services/api';
import toast from 'react-hot-toast';
import { sanitizeInput, validateFieldKey } from '../utils/sanitize';

export default function FormConfigPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    field_key: '',
    field_type: 'text',
    label: '',
    placeholder: '',
    is_required: false,
    order_index: 0,
    section: 'General'
  });
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['form-configs'],
    queryFn: formConfigService.getAll
  });

  const createMutation = useMutation({
    mutationFn: formConfigService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['form-configs']);
      toast.success('Field created');
      setShowForm(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create field')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => formConfigService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['form-configs']);
      toast.success('Field updated');
      setShowForm(false);
      setEditing(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update field')
  });

  const deleteMutation = useMutation({
    mutationFn: formConfigService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['form-configs']);
      toast.success('Field deleted');
    },
    onError: () => toast.error('Failed to delete field')
  });

  const resetForm = () => {
    setFormData({
      field_key: '',
      field_type: 'text',
      label: '',
      placeholder: '',
      is_required: false,
      order_index: 0,
      section: 'General'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (config) => {
    setEditing(config);
    setFormData(config);
    setShowForm(true);
  };

  const configs = data?.data?.form_configs || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Form Builder</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Field
        </button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editing ? 'Edit Field' : 'Add Field'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Field Key (unique identifier)</label>
                <input
                  type="text"
                  value={formData.field_key}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    if (sanitized && !validateFieldKey(sanitized)) {
                      toast.error('Field key can only contain letters, numbers, and underscores');
                      return;
                    }
                    setFormData({ ...formData, field_key: sanitized });
                  }}
                  pattern="[a-zA-Z0-9_]+"
                  maxLength={50}
                  required
                  disabled={!!editing}
                />
              </div>
              <div className="form-group">
                <label>Field Type</label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                  required
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="textarea">Textarea</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: sanitizeInput(e.target.value) })}
                  maxLength={255}
                  required
                />
              </div>
              <div className="form-group">
                <label>Placeholder</label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: sanitizeInput(e.target.value) })}
                  maxLength={255}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  />
                  Required Field
                </label>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: sanitizeInput(e.target.value) })}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Order Index</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="form-configs-list">
        {configs.map((config) => (
          <div key={config.id} className="config-card">
            <div className="config-header">
              <h3>{config.label}</h3>
              <span className="field-type">{config.field_type}</span>
            </div>
            <div className="config-details">
              <p>Key: {config.field_key}</p>
              <p>Section: {config.section}</p>
              <p>Required: {config.is_required ? 'Yes' : 'No'}</p>
              <p>Order: {config.order_index}</p>
            </div>
            <div className="config-actions">
              <button onClick={() => handleEdit(config)} className="btn-link">
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this field?')) {
                    deleteMutation.mutate(config.id);
                  }
                }}
                className="btn-link danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

