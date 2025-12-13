import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formConfigsApi } from '../lib/api';
import { FormField, FieldType } from '../types';
import {
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Save,
  X,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  AlignLeft,
  FileUp,
  Pencil,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const fieldTypeOptions: { value: FieldType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'datetime', label: 'Date & Time', icon: Calendar },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio Buttons', icon: Circle },
  { value: 'file', label: 'File Upload', icon: FileUp },
  { value: 'signature', label: 'Signature', icon: Pencil },
];

interface FieldEditorProps {
  field?: FormField;
  onSave: (data: Partial<FormField>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function FieldEditor({ field, onSave, onCancel, isLoading }: FieldEditorProps) {
  const [formData, setFormData] = useState({
    fieldKey: field?.fieldKey || '',
    fieldType: field?.fieldType || 'text' as FieldType,
    label: field?.label || '',
    placeholder: field?.placeholder || '',
    isRequired: field?.isRequired || false,
    section: field?.section || '',
    options: field?.options || [],
  });
  const [newOption, setNewOption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fieldKey || !formData.label) {
      toast.error('Field key and label are required');
      return;
    }
    onSave(formData);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, { label: newOption.trim(), value: newOption.trim().toLowerCase().replace(/\s+/g, '_') }],
      });
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const needsOptions = ['dropdown', 'radio', 'checkbox'].includes(formData.fieldType);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., driver_statement"
            value={formData.fieldKey}
            onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            disabled={!!field}
          />
          <p className="mt-1 text-xs text-gray-500">Unique identifier (no spaces)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <select
            className="input"
            value={formData.fieldType}
            onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as FieldType })}
          >
            {fieldTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Label <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Driver Statement"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder Text
        </label>
        <input
          type="text"
          className="input"
          placeholder="Hint text for the field"
          value={formData.placeholder}
          onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Section (Optional)
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Vehicle Information"
          value={formData.section}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
        />
      </div>

      {needsOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options
          </label>
          <div className="space-y-2 mb-2">
            {formData.options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={opt.label}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add an option..."
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
            />
            <button
              type="button"
              onClick={addOption}
              className="btn-secondary"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRequired"
          checked={formData.isRequired}
          onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
          className="w-4 h-4 text-primary-600 rounded"
        />
        <label htmlFor="isRequired" className="text-sm text-gray-700">
          This field is required
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Field
        </button>
      </div>
    </form>
  );
}

export function FormBuilderPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['formConfigs'],
    queryFn: async () => {
      const response = await formConfigsApi.getAll();
      return response.data.form_configs;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (fieldData: Partial<FormField>) => {
      const response = await formConfigsApi.create({
        field_key: fieldData.fieldKey,
        field_type: fieldData.fieldType,
        label: fieldData.label,
        placeholder: fieldData.placeholder,
        is_required: fieldData.isRequired,
        section: fieldData.section,
        options: fieldData.options,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formConfigs'] });
      setIsAdding(false);
      toast.success('Field created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create field');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormField> }) => {
      const response = await formConfigsApi.update(id, {
        field_type: data.fieldType,
        label: data.label,
        placeholder: data.placeholder,
        is_required: data.isRequired,
        section: data.section,
        options: data.options,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formConfigs'] });
      setEditingField(null);
      toast.success('Field updated successfully');
    },
    onError: () => {
      toast.error('Failed to update field');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await formConfigsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formConfigs'] });
      toast.success('Field deleted');
    },
    onError: () => {
      toast.error('Failed to delete field');
    },
  });

  const fields: FormField[] = (data || []).map((f: any) => ({
    id: f.id,
    fieldKey: f.field_key,
    fieldType: f.field_type,
    label: f.label,
    placeholder: f.placeholder,
    isRequired: f.is_required,
    orderIndex: f.order_index,
    section: f.section,
    options: f.options,
  }));

  // Group fields by section
  const sections = fields.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  const getFieldTypeIcon = (type: FieldType) => {
    const opt = fieldTypeOptions.find((o) => o.value === type);
    return opt?.icon || Type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize the fields drivers fill out when reporting incidents
          </p>
        </div>
        {!isAdding && !editingField && (
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingField) && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingField ? 'Edit Field' : 'Add New Field'}
          </h2>
          <FieldEditor
            field={editingField || undefined}
            onSave={(data) => {
              if (editingField) {
                updateMutation.mutate({ id: editingField.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setIsAdding(false);
              setEditingField(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      {/* Fields list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fields.length === 0 ? (
        <div className="card p-12 text-center">
          <Type className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No custom fields yet</h3>
          <p className="mt-2 text-gray-500">
            Add custom fields to collect specific information from drivers.
          </p>
          <button onClick={() => setIsAdding(true)} className="btn-primary mt-4">
            Add Your First Field
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sections).map(([sectionName, sectionFields]) => (
            <div key={sectionName} className="card">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                <h3 className="font-medium text-gray-900">{sectionName}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {sectionFields.map((field) => {
                  const FieldIcon = getFieldTypeIcon(field.fieldType);
                  return (
                    <div
                      key={field.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FieldIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          {field.isRequired && (
                            <span className="text-xs text-red-500">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {field.fieldKey} • {field.fieldType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingField(field)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this field?')) {
                              deleteMutation.mutate(field.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
