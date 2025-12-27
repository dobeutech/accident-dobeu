const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

class TelematicsService {
  constructor() {
    this.providers = {
      geotab: this.geotabProvider.bind(this),
      samsara: this.samsaraProvider.bind(this),
      verizon_connect: this.verizonConnectProvider.bind(this),
      fleet_complete: this.fleetCompleteProvider.bind(this),
      teletrac_navman: this.teletracNavmanProvider.bind(this),
      custom: this.customProvider.bind(this)
    };
  }

  /**
   * Engage kill switch for a vehicle
   */
  async engageKillSwitch(vehicleId, reportId, userId, reason = 'Accident workflow incomplete') {
    try {
      logger.info(`Engaging kill switch for vehicle ${vehicleId}`);

      // Get vehicle and telematics info
      const [vehicles] = await sequelize.query(`
        SELECT v.*, tp.provider_name, tp.api_endpoint, tp.api_key_encrypted, tp.api_secret_encrypted, tp.additional_config
        FROM vehicles v
        LEFT JOIN telematics_providers tp ON v.telematics_provider_id = tp.id
        WHERE v.id = :vehicle_id AND v.kill_switch_enabled = true
      `, {
        replacements: { vehicle_id: vehicleId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!vehicles || vehicles.length === 0) {
        throw new Error('Vehicle not found or kill switch not enabled');
      }

      const vehicle = vehicles[0];

      // Update vehicle status
      await sequelize.query(`
        UPDATE vehicles
        SET kill_switch_status = 'engaged',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :vehicle_id
      `, {
        replacements: { vehicle_id: vehicleId },
        type: sequelize.QueryTypes.UPDATE
      });

      // Log kill switch event
      await this.logKillSwitchEvent(
        vehicleId,
        vehicle.fleet_id,
        reportId,
        'engaged',
        userId,
        reason,
        vehicle.last_location_lat,
        vehicle.last_location_lng
      );

      // Send command to telematics provider
      if (vehicle.provider_name && vehicle.telematics_device_id) {
        const provider = this.providers[vehicle.provider_name];
        if (provider) {
          await provider('engage', vehicle);
        }
      }

      logger.info(`Kill switch engaged successfully for vehicle ${vehicleId}`);
      
      return {
        success: true,
        vehicleId,
        status: 'engaged',
        message: 'Kill switch engaged. Vehicle immobilized.'
      };

    } catch (error) {
      logger.error(`Failed to engage kill switch for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Disengage kill switch for a vehicle
   */
  async disengageKillSwitch(vehicleId, reportId, userId, reason = 'Workflow completed') {
    try {
      logger.info(`Disengaging kill switch for vehicle ${vehicleId}`);

      // Get vehicle and telematics info
      const [vehicles] = await sequelize.query(`
        SELECT v.*, tp.provider_name, tp.api_endpoint, tp.api_key_encrypted, tp.api_secret_encrypted, tp.additional_config
        FROM vehicles v
        LEFT JOIN telematics_providers tp ON v.telematics_provider_id = tp.id
        WHERE v.id = :vehicle_id
      `, {
        replacements: { vehicle_id: vehicleId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!vehicles || vehicles.length === 0) {
        throw new Error('Vehicle not found');
      }

      const vehicle = vehicles[0];

      // Update vehicle status
      await sequelize.query(`
        UPDATE vehicles
        SET kill_switch_status = 'inactive',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :vehicle_id
      `, {
        replacements: { vehicle_id: vehicleId },
        type: sequelize.QueryTypes.UPDATE
      });

      // Log kill switch event
      await this.logKillSwitchEvent(
        vehicleId,
        vehicle.fleet_id,
        reportId,
        'disengaged',
        userId,
        reason,
        vehicle.last_location_lat,
        vehicle.last_location_lng
      );

      // Send command to telematics provider
      if (vehicle.provider_name && vehicle.telematics_device_id) {
        const provider = this.providers[vehicle.provider_name];
        if (provider) {
          await provider('disengage', vehicle);
        }
      }

      logger.info(`Kill switch disengaged successfully for vehicle ${vehicleId}`);
      
      return {
        success: true,
        vehicleId,
        status: 'inactive',
        message: 'Kill switch disengaged. Vehicle operational.'
      };

    } catch (error) {
      logger.error(`Failed to disengage kill switch for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Check if kill switch should be engaged based on workflow status
   */
  async checkAndEngageKillSwitch(reportId) {
    try {
      // Get workflow completion status
      const [workflows] = await sequelize.query(`
        SELECT wc.*, v.id as vehicle_id, v.kill_switch_enabled, v.kill_switch_status
        FROM workflow_completions wc
        JOIN vehicles v ON wc.vehicle_id = v.id
        WHERE wc.report_id = :report_id
      `, {
        replacements: { report_id: reportId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!workflows || workflows.length === 0) {
        return { shouldEngage: false, reason: 'No workflow found' };
      }

      const workflow = workflows[0];

      // Check if workflow is incomplete and kill switch is enabled
      if (!workflow.is_complete && workflow.kill_switch_enabled && workflow.kill_switch_status === 'inactive') {
        await this.engageKillSwitch(
          workflow.vehicle_id,
          reportId,
          workflow.driver_id,
          'Accident workflow incomplete - automatic engagement'
        );

        // Update workflow
        await sequelize.query(`
          UPDATE workflow_completions
          SET kill_switch_engaged = true,
              kill_switch_engaged_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = :workflow_id
        `, {
          replacements: { workflow_id: workflow.id },
          type: sequelize.QueryTypes.UPDATE
        });

        return { shouldEngage: true, engaged: true };
      }

      return { shouldEngage: false, reason: 'Conditions not met' };

    } catch (error) {
      logger.error('Failed to check and engage kill switch:', error);
      throw error;
    }
  }

  /**
   * Log kill switch event
   */
  async logKillSwitchEvent(vehicleId, fleetId, reportId, eventType, userId, reason, lat, lng, metadata = {}) {
    await sequelize.query(`
      INSERT INTO kill_switch_events
        (vehicle_id, fleet_id, report_id, event_type, triggered_by_user_id, reason, location_lat, location_lng, metadata)
      VALUES
        (:vehicle_id, :fleet_id, :report_id, :event_type, :user_id, :reason, :lat, :lng, :metadata)
    `, {
      replacements: {
        vehicle_id: vehicleId,
        fleet_id: fleetId,
        report_id: reportId,
        event_type: eventType,
        user_id: userId,
        reason,
        lat,
        lng,
        metadata: JSON.stringify(metadata)
      },
      type: sequelize.QueryTypes.INSERT
    });
  }

  /**
   * Geotab provider integration
   */
  async geotabProvider(action, vehicle) {
    try {
      const config = JSON.parse(vehicle.additional_config || '{}');
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      
      const endpoint = vehicle.api_endpoint || 'https://my.geotab.com/apiv1';
      const command = action === 'engage' ? 'ImmobilizeDevice' : 'MobilizeDevice';

      const response = await axios.post(endpoint, {
        method: command,
        params: {
          credentials: {
            database: config.database,
            userName: config.userName,
            sessionId: apiKey
          },
          typeName: 'Device',
          entity: {
            id: vehicle.telematics_device_id
          }
        }
      });

      logger.info(`Geotab ${action} command sent for device ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Geotab provider error:`, error);
      throw error;
    }
  }

  /**
   * Samsara provider integration
   */
  async samsaraProvider(action, vehicle) {
    try {
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      const endpoint = vehicle.api_endpoint || 'https://api.samsara.com';
      
      const command = action === 'engage' ? 'immobilize' : 'mobilize';
      const url = `${endpoint}/fleet/vehicles/${vehicle.telematics_device_id}/${command}`;

      const response = await axios.post(url, {}, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Samsara ${action} command sent for vehicle ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Samsara provider error:`, error);
      throw error;
    }
  }

  /**
   * Verizon Connect provider integration
   */
  async verizonConnectProvider(action, vehicle) {
    try {
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      const apiSecret = this.decrypt(vehicle.api_secret_encrypted);
      const endpoint = vehicle.api_endpoint || 'https://api.verizonconnect.com';
      
      const command = action === 'engage' ? 'disable' : 'enable';
      const url = `${endpoint}/api/v1/vehicles/${vehicle.telematics_device_id}/starter/${command}`;

      const response = await axios.post(url, {}, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Verizon Connect ${action} command sent for vehicle ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Verizon Connect provider error:`, error);
      throw error;
    }
  }

  /**
   * Fleet Complete provider integration
   */
  async fleetCompleteProvider(action, vehicle) {
    try {
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      const endpoint = vehicle.api_endpoint || 'https://api.fleetcomplete.com';
      
      const command = action === 'engage' ? 'immobilize' : 'mobilize';
      const url = `${endpoint}/api/v2/vehicles/${vehicle.telematics_device_id}/${command}`;

      const response = await axios.post(url, {}, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Fleet Complete ${action} command sent for vehicle ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Fleet Complete provider error:`, error);
      throw error;
    }
  }

  /**
   * Teletrac Navman provider integration
   */
  async teletracNavmanProvider(action, vehicle) {
    try {
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      const endpoint = vehicle.api_endpoint || 'https://api.teletracnavman.com';
      
      const command = action === 'engage' ? 'immobilize' : 'mobilize';
      const url = `${endpoint}/api/v1/vehicles/${vehicle.telematics_device_id}/immobilizer`;

      const response = await axios.put(url, {
        action: command
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Teletrac Navman ${action} command sent for vehicle ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Teletrac Navman provider error:`, error);
      throw error;
    }
  }

  /**
   * Custom provider integration
   */
  async customProvider(action, vehicle) {
    try {
      const config = JSON.parse(vehicle.additional_config || '{}');
      const apiKey = this.decrypt(vehicle.api_key_encrypted);
      
      if (!config.endpoint || !config.method) {
        throw new Error('Custom provider requires endpoint and method in additional_config');
      }

      const response = await axios({
        method: config.method,
        url: config.endpoint.replace('{deviceId}', vehicle.telematics_device_id).replace('{action}', action),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers
        },
        data: config.payload || {}
      });

      logger.info(`Custom provider ${action} command sent for vehicle ${vehicle.telematics_device_id}`);
      return response.data;

    } catch (error) {
      logger.error(`Custom provider error:`, error);
      throw error;
    }
  }

  /**
   * Update vehicle location from telematics
   */
  async updateVehicleLocation(vehicleId, lat, lng) {
    await sequelize.query(`
      UPDATE vehicles
      SET last_location_lat = :lat,
          last_location_lng = :lng,
          last_location_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :vehicle_id
    `, {
      replacements: { vehicle_id: vehicleId, lat, lng },
      type: sequelize.QueryTypes.UPDATE
    });
  }

  /**
   * Get vehicle status
   */
  async getVehicleStatus(vehicleId) {
    const [vehicles] = await sequelize.query(`
      SELECT v.*, 
             u.first_name || ' ' || u.last_name as current_driver_name,
             tp.provider_name
      FROM vehicles v
      LEFT JOIN users u ON v.current_driver_id = u.id
      LEFT JOIN telematics_providers tp ON v.telematics_provider_id = tp.id
      WHERE v.id = :vehicle_id
    `, {
      replacements: { vehicle_id: vehicleId },
      type: sequelize.QueryTypes.SELECT
    });

    return vehicles[0] || null;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = new TelematicsService();
