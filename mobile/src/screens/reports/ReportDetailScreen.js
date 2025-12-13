import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { reportStorage } from '../../storage/database';
import { reportService } from '../../services/api';

export default function ReportDetailScreen({ route }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const localReport = await reportStorage.getById(reportId);
      setReport(localReport);
      
      // Try to get latest from server
      try {
        const response = await reportService.getById(reportId);
        setReport(response.data.report);
      } catch (error) {
        console.error('Error loading from server:', error);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Report Number</Text>
          <Text style={styles.value}>{report.report_number || 'Draft'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Incident Type</Text>
          <Text style={styles.value}>{report.incident_type}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{report.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {new Date(report.incident_date || report.created_at).toLocaleString()}
          </Text>
        </View>

        {report.address && (
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{report.address}</Text>
          </View>
        )}

        {report.custom_fields && Object.keys(report.custom_fields).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Additional Information</Text>
            {Object.entries(report.custom_fields).map(([key, value]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{key}:</Text>
                <Text style={styles.fieldValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 20
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  value: {
    fontSize: 16,
    color: '#333'
  },
  fieldRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 120
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
  }
});

