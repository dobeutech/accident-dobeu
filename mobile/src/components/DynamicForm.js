import React from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';

export default function DynamicForm({ configs = [], data = {}, onChange }) {
  const handleChange = (fieldKey, value) => {
    onChange({ ...data, [fieldKey]: value });
  };

  const renderField = (config) => {
    const value = data[config.field_key] || config.default_value || '';

    switch (config.field_type) {
      case 'text':
      case 'textarea':
        return (
          <View key={config.id} style={styles.field}>
            <Text style={styles.label}>
              {config.label}
              {config.is_required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[styles.input, config.field_type === 'textarea' && styles.textarea]}
              value={String(value)}
              onChangeText={(text) => handleChange(config.field_key, text)}
              placeholder={config.placeholder}
              multiline={config.field_type === 'textarea'}
              numberOfLines={config.field_type === 'textarea' ? 4 : 1}
            />
          </View>
        );

      case 'number':
        return (
          <View key={config.id} style={styles.field}>
            <Text style={styles.label}>
              {config.label}
              {config.is_required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => handleChange(config.field_key, parseFloat(text) || 0)}
              placeholder={config.placeholder}
              keyboardType="numeric"
            />
          </View>
        );

      case 'date':
        return (
          <View key={config.id} style={styles.field}>
            <Text style={styles.label}>
              {config.label}
              {config.is_required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => handleChange(config.field_key, text)}
              placeholder={config.placeholder || 'YYYY-MM-DD'}
            />
          </View>
        );

      case 'checkbox':
        return (
          <View key={config.id} style={styles.field}>
            <View style={styles.checkboxRow}>
              <Switch
                value={Boolean(value)}
                onValueChange={(val) => handleChange(config.field_key, val)}
              />
              <Text style={styles.label}>
                {config.label}
                {config.is_required && <Text style={styles.required}> *</Text>}
              </Text>
            </View>
          </View>
        );

      case 'dropdown':
        // Simplified - would need a proper picker component
        return (
          <View key={config.id} style={styles.field}>
            <Text style={styles.label}>
              {config.label}
              {config.is_required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => handleChange(config.field_key, text)}
              placeholder={config.placeholder || 'Select option'}
            />
          </View>
        );

      default:
        return (
          <View key={config.id} style={styles.field}>
            <Text style={styles.label}>{config.label}</Text>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => handleChange(config.field_key, text)}
              placeholder={config.placeholder}
            />
          </View>
        );
    }
  };

  // Group by section
  const sections = {};
  configs.forEach(config => {
    const section = config.section || 'General';
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(config);
  });

  // Sort configs by order_index
  Object.keys(sections).forEach(section => {
    sections[section].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  });

  return (
    <View style={styles.container}>
      {Object.entries(sections).map(([sectionName, sectionConfigs]) => (
        <View key={sectionName} style={styles.section}>
          {sectionName !== 'General' && (
            <Text style={styles.sectionTitle}>{sectionName}</Text>
          )}
          {sectionConfigs.map(renderField)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333'
  },
  field: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  required: {
    color: '#FF3B30'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});

