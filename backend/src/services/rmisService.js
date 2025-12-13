const axios = require('axios');
const logger = require('../utils/logger');
const { sequelize } = require('../database/connection');

/**
 * RMIS (Risk Management Information System) Integration Service
 * 
 * Supports integration with:
 * - Origami Risk
 * - Riskonnect
 * - Custom API endpoints
 */
class RMISService {
  constructor() {
    this.integrations = new Map();
  }

  /**
   * Register an RMIS integration for a fleet
   */
  async registerIntegration(fleetId, integrationType, config) {
    try {
      // Store integration config in database
      await sequelize.query(`
        INSERT INTO rmis_integrations 
          (fleet_id, integration_type, config, is_active, created_at, updated_at)
        VALUES 
          (:fleet_id, :integration_type, :config, true, NOW(), NOW())
        ON CONFLICT (fleet_id, integration_type) 
        DO UPDATE SET config = :config, updated_at = NOW()
      `, {
        replacements: {
          fleet_id: fleetId,
          integration_type: integrationType,
          config: JSON.stringify(config),
        },
        type: sequelize.QueryTypes.INSERT,
      });

      logger.info(`RMIS integration registered: ${integrationType} for fleet ${fleetId}`);
      return { success: true };
    } catch (error) {
      logger.error('Register RMIS integration error:', error);
      throw error;
    }
  }

  /**
   * Get integration config for a fleet
   */
  async getIntegration(fleetId, integrationType) {
    try {
      const results = await sequelize.query(`
        SELECT * FROM rmis_integrations 
        WHERE fleet_id = :fleet_id AND integration_type = :integration_type AND is_active = true
      `, {
        replacements: { fleet_id: fleetId, integration_type: integrationType },
        type: sequelize.QueryTypes.SELECT,
      });

      return results && results.length > 0 ? JSON.parse(results[0].config) : null;
    } catch (error) {
      logger.error('Get RMIS integration error:', error);
      return null;
    }
  }

  /**
   * Push report to Origami Risk
   * 
   * Origami Risk API documentation: https://api.origamirisk.com/docs
   */
  async pushToOrigamiRisk(fleetId, report) {
    const config = await this.getIntegration(fleetId, 'origami_risk');
    
    if (!config) {
      logger.warn(`No Origami Risk integration configured for fleet ${fleetId}`);
      return { success: false, error: 'Integration not configured' };
    }

    try {
      // Map report data to Origami Risk schema
      const payload = this.mapToOrigamiSchema(report);

      const response = await axios.post(
        `${config.baseUrl}/api/v2/claims`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'X-Client-Id': config.clientId,
          },
          timeout: 30000,
        }
      );

      // Log successful push
      await this.logIntegrationEvent(fleetId, 'origami_risk', 'push', report.id, 'success', response.data);

      logger.info(`Report ${report.id} pushed to Origami Risk successfully`);
      return { success: true, externalId: response.data.claimId };

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      
      // Log failed push
      await this.logIntegrationEvent(fleetId, 'origami_risk', 'push', report.id, 'failed', { error: errorMessage });

      logger.error(`Failed to push report ${report.id} to Origami Risk:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Map internal report format to Origami Risk schema
   */
  mapToOrigamiSchema(report) {
    return {
      claimType: this.mapIncidentType(report.incident_type),
      dateOfLoss: report.incident_date,
      dateReported: report.created_at,
      reportNumber: report.report_number,
      
      location: {
        address: report.address,
        latitude: report.latitude,
        longitude: report.longitude,
      },

      claimant: {
        type: 'employee',
        employeeId: report.driver_id,
        name: report.driver_name,
        email: report.driver_email,
      },

      vehicleInfo: {
        unitNumber: report.custom_fields?.vehicle_number,
        year: report.custom_fields?.vehicle_year,
        make: report.custom_fields?.vehicle_make,
        model: report.custom_fields?.vehicle_model,
        licensePlate: report.custom_fields?.vehicle_plate,
        vin: report.custom_fields?.vehicle_vin,
      },

      damageInfo: {
        description: report.custom_fields?.damage_description,
        isDrivable: report.custom_fields?.vehicle_drivable,
        towRequired: report.custom_fields?.tow_required,
      },

      thirdParty: report.custom_fields?.has_other_party ? {
        driverName: `${report.custom_fields?.other_driver_first_name || ''} ${report.custom_fields?.other_driver_last_name || ''}`.trim(),
        driverPhone: report.custom_fields?.other_driver_phone,
        driverLicense: report.custom_fields?.other_driver_license,
        vehicleInfo: {
          year: report.custom_fields?.other_vehicle_year,
          make: report.custom_fields?.other_vehicle_make,
          model: report.custom_fields?.other_vehicle_model,
          color: report.custom_fields?.other_vehicle_color,
          licensePlate: report.custom_fields?.other_vehicle_plate,
        },
        insuranceInfo: {
          company: report.custom_fields?.other_insurance_company,
          policyNumber: report.custom_fields?.other_insurance_policy,
          phone: report.custom_fields?.other_insurance_phone,
        },
      } : null,

      witnesses: report.custom_fields?.witnesses || [],

      narrative: report.custom_fields?.driver_statement,

      attachments: {
        photoCount: report.photos?.length || 0,
        audioCount: report.audio?.length || 0,
      },

      metadata: {
        sourceSystem: 'FleetAccidentReporter',
        reportId: report.id,
        submittedAt: report.created_at,
      },
    };
  }

  /**
   * Push report to Riskonnect
   */
  async pushToRiskonnect(fleetId, report) {
    const config = await this.getIntegration(fleetId, 'riskonnect');
    
    if (!config) {
      logger.warn(`No Riskonnect integration configured for fleet ${fleetId}`);
      return { success: false, error: 'Integration not configured' };
    }

    try {
      // Map report data to Riskonnect schema
      const payload = this.mapToRiskonnectSchema(report);

      // Riskonnect uses SOAP or REST depending on version
      const response = await axios.post(
        `${config.baseUrl}/api/incidents`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      await this.logIntegrationEvent(fleetId, 'riskonnect', 'push', report.id, 'success', response.data);

      logger.info(`Report ${report.id} pushed to Riskonnect successfully`);
      return { success: true, externalId: response.data.incidentId };

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      await this.logIntegrationEvent(fleetId, 'riskonnect', 'push', report.id, 'failed', { error: errorMessage });

      logger.error(`Failed to push report ${report.id} to Riskonnect:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Map internal report format to Riskonnect schema
   */
  mapToRiskonnectSchema(report) {
    return {
      incidentType: this.mapIncidentType(report.incident_type),
      occurredDate: report.incident_date,
      reportedDate: report.created_at,
      referenceNumber: report.report_number,
      
      locationDetails: {
        streetAddress: report.address,
        gpsLatitude: report.latitude,
        gpsLongitude: report.longitude,
      },

      involvedParties: [
        {
          partyType: 'Driver',
          personId: report.driver_id,
          fullName: report.driver_name,
          emailAddress: report.driver_email,
        },
      ],

      vehicleDetails: {
        fleetVehicleId: report.custom_fields?.vehicle_number,
        vehicleYear: report.custom_fields?.vehicle_year,
        vehicleMake: report.custom_fields?.vehicle_make,
        vehicleModel: report.custom_fields?.vehicle_model,
        licensePlateNumber: report.custom_fields?.vehicle_plate,
      },

      incidentDescription: report.custom_fields?.driver_statement,

      customData: {
        sourceApplication: 'FleetAccidentReporter',
        originalReportId: report.id,
      },
    };
  }

  /**
   * Push report to custom API endpoint
   */
  async pushToCustomAPI(fleetId, report) {
    const config = await this.getIntegration(fleetId, 'custom_api');
    
    if (!config) {
      logger.warn(`No custom API integration configured for fleet ${fleetId}`);
      return { success: false, error: 'Integration not configured' };
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      };

      // Add authentication based on config
      if (config.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.authType === 'basic') {
        headers['Authorization'] = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
      } else if (config.authType === 'apikey') {
        headers[config.apiKeyHeader || 'X-API-Key'] = config.apiKey;
      }

      // Use custom field mapping if provided, otherwise send full report
      const payload = config.fieldMapping 
        ? this.applyCustomMapping(report, config.fieldMapping)
        : report;

      const response = await axios({
        method: config.method || 'POST',
        url: config.endpoint,
        headers,
        data: payload,
        timeout: config.timeout || 30000,
      });

      await this.logIntegrationEvent(fleetId, 'custom_api', 'push', report.id, 'success', response.data);

      logger.info(`Report ${report.id} pushed to custom API successfully`);
      return { success: true, response: response.data };

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      await this.logIntegrationEvent(fleetId, 'custom_api', 'push', report.id, 'failed', { error: errorMessage });

      logger.error(`Failed to push report ${report.id} to custom API:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Apply custom field mapping
   */
  applyCustomMapping(report, mapping) {
    const result = {};

    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const value = this.getNestedValue(report, sourceField);
      this.setNestedValue(result, targetField, value);
    }

    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Map incident type to external format
   */
  mapIncidentType(type) {
    const mapping = {
      'accident': 'AUTO_ACCIDENT',
      'incident': 'GENERAL_LIABILITY',
      'near_miss': 'NEAR_MISS',
    };
    return mapping[type] || 'OTHER';
  }

  /**
   * Log integration event for audit trail
   */
  async logIntegrationEvent(fleetId, integrationType, action, reportId, status, details) {
    try {
      await sequelize.query(`
        INSERT INTO rmis_integration_logs 
          (fleet_id, integration_type, action, report_id, status, details, created_at)
        VALUES 
          (:fleet_id, :integration_type, :action, :report_id, :status, :details, NOW())
      `, {
        replacements: {
          fleet_id: fleetId,
          integration_type: integrationType,
          action,
          report_id: reportId,
          status,
          details: JSON.stringify(details),
        },
        type: sequelize.QueryTypes.INSERT,
      });
    } catch (error) {
      logger.error('Failed to log integration event:', error);
    }
  }

  /**
   * Auto-push report to all configured integrations for a fleet
   */
  async autoPushReport(fleetId, report) {
    const results = {};

    // Check for Origami Risk
    const origamiConfig = await this.getIntegration(fleetId, 'origami_risk');
    if (origamiConfig?.autoPush) {
      results.origami_risk = await this.pushToOrigamiRisk(fleetId, report);
    }

    // Check for Riskonnect
    const riskonnectConfig = await this.getIntegration(fleetId, 'riskonnect');
    if (riskonnectConfig?.autoPush) {
      results.riskonnect = await this.pushToRiskonnect(fleetId, report);
    }

    // Check for Custom API
    const customApiConfig = await this.getIntegration(fleetId, 'custom_api');
    if (customApiConfig?.autoPush) {
      results.custom_api = await this.pushToCustomAPI(fleetId, report);
    }

    return results;
  }
}

module.exports = new RMISService();
