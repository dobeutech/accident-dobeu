const telematicsService = require('../../services/telematicsService');
const { sequelize } = require('../../database/connection');
const axios = require('axios');

// Mock dependencies
jest.mock('axios');
jest.mock('../../database/connection');

describe('TelematicsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.query = jest.fn();
  });

  describe('engageKillSwitch', () => {
    it('should successfully engage kill switch', async () => {
      const vehicleId = 'vehicle-uuid';
      const reportId = 'report-uuid';
      const userId = 'user-uuid';
      const reason = 'Accident workflow incomplete';

      const mockVehicle = {
        id: vehicleId,
        fleet_id: 'fleet-uuid',
        kill_switch_enabled: true,
        provider_name: 'samsara',
        telematics_device_id: 'device-123',
        api_endpoint: 'https://api.samsara.com',
        api_key_encrypted: 'encrypted_key',
        last_location_lat: 40.7128,
        last_location_lng: -74.0060,
      };

      // Mock database queries
      sequelize.query
        .mockResolvedValueOnce([[mockVehicle]]) // Get vehicle
        .mockResolvedValueOnce([]) // Update vehicle status
        .mockResolvedValueOnce([]); // Log event

      // Mock API call
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await telematicsService.engageKillSwitch(
        vehicleId,
        reportId,
        userId,
        reason
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('engaged');
      expect(sequelize.query).toHaveBeenCalledTimes(3);
      expect(axios.post).toHaveBeenCalled();
    });

    it('should throw error if vehicle not found', async () => {
      const vehicleId = 'invalid-uuid';
      const reportId = 'report-uuid';
      const userId = 'user-uuid';

      sequelize.query.mockResolvedValueOnce([[]]);

      await expect(
        telematicsService.engageKillSwitch(vehicleId, reportId, userId)
      ).rejects.toThrow('Vehicle not found or kill switch not enabled');
    });

    it('should throw error if kill switch not enabled', async () => {
      const vehicleId = 'vehicle-uuid';
      const reportId = 'report-uuid';
      const userId = 'user-uuid';

      const mockVehicle = {
        id: vehicleId,
        kill_switch_enabled: false,
      };

      sequelize.query.mockResolvedValueOnce([[mockVehicle]]);

      await expect(
        telematicsService.engageKillSwitch(vehicleId, reportId, userId)
      ).rejects.toThrow('Vehicle not found or kill switch not enabled');
    });
  });

  describe('disengageKillSwitch', () => {
    it('should successfully disengage kill switch', async () => {
      const vehicleId = 'vehicle-uuid';
      const reportId = 'report-uuid';
      const userId = 'user-uuid';
      const reason = 'Workflow completed';

      const mockVehicle = {
        id: vehicleId,
        fleet_id: 'fleet-uuid',
        provider_name: 'samsara',
        telematics_device_id: 'device-123',
        api_endpoint: 'https://api.samsara.com',
        api_key_encrypted: 'encrypted_key',
        last_location_lat: 40.7128,
        last_location_lng: -74.0060,
      };

      sequelize.query
        .mockResolvedValueOnce([[mockVehicle]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await telematicsService.disengageKillSwitch(
        vehicleId,
        reportId,
        userId,
        reason
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('inactive');
    });
  });

  describe('checkAndEngageKillSwitch', () => {
    it('should engage kill switch if workflow incomplete', async () => {
      const reportId = 'report-uuid';

      const mockWorkflow = {
        id: 'workflow-uuid',
        vehicle_id: 'vehicle-uuid',
        is_complete: false,
        kill_switch_enabled: true,
        kill_switch_status: 'inactive',
        driver_id: 'driver-uuid',
      };

      const mockVehicle = {
        id: 'vehicle-uuid',
        fleet_id: 'fleet-uuid',
        kill_switch_enabled: true,
        provider_name: 'samsara',
        telematics_device_id: 'device-123',
        api_endpoint: 'https://api.samsara.com',
        api_key_encrypted: 'encrypted_key',
      };

      sequelize.query
        .mockResolvedValueOnce([[mockWorkflow]]) // Get workflow
        .mockResolvedValueOnce([[mockVehicle]]) // Get vehicle for engage
        .mockResolvedValueOnce([]) // Update vehicle
        .mockResolvedValueOnce([]) // Log event
        .mockResolvedValueOnce([]); // Update workflow

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await telematicsService.checkAndEngageKillSwitch(reportId);

      expect(result.shouldEngage).toBe(true);
      expect(result.engaged).toBe(true);
    });

    it('should not engage if workflow complete', async () => {
      const reportId = 'report-uuid';

      const mockWorkflow = {
        id: 'workflow-uuid',
        vehicle_id: 'vehicle-uuid',
        is_complete: true,
        kill_switch_enabled: true,
        kill_switch_status: 'inactive',
      };

      sequelize.query.mockResolvedValueOnce([[mockWorkflow]]);

      const result = await telematicsService.checkAndEngageKillSwitch(reportId);

      expect(result.shouldEngage).toBe(false);
    });
  });

  describe('Provider Integrations', () => {
    describe('samsaraProvider', () => {
      it('should send immobilize command to Samsara', async () => {
        const vehicle = {
          telematics_device_id: 'device-123',
          api_endpoint: 'https://api.samsara.com',
          api_key_encrypted: telematicsService.encrypt('test-api-key'),
        };

        axios.post.mockResolvedValueOnce({ data: { success: true } });

        await telematicsService.samsaraProvider('engage', vehicle);

        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('immobilize'),
          {},
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.stringContaining('Bearer'),
            }),
          })
        );
      });
    });

    describe('geotabProvider', () => {
      it('should send immobilize command to Geotab', async () => {
        const vehicle = {
          telematics_device_id: 'device-123',
          api_endpoint: 'https://my.geotab.com/apiv1',
          api_key_encrypted: telematicsService.encrypt('test-session-id'),
          additional_config: JSON.stringify({
            database: 'test-db',
            userName: 'test-user',
          }),
        };

        axios.post.mockResolvedValueOnce({ data: { result: 'success' } });

        await telematicsService.geotabProvider('engage', vehicle);

        expect(axios.post).toHaveBeenCalledWith(
          vehicle.api_endpoint,
          expect.objectContaining({
            method: 'ImmobilizeDevice',
          })
        );
      });
    });
  });

  describe('updateVehicleLocation', () => {
    it('should update vehicle location', async () => {
      const vehicleId = 'vehicle-uuid';
      const lat = 40.7128;
      const lng = -74.0060;

      sequelize.query.mockResolvedValueOnce([]);

      await telematicsService.updateVehicleLocation(vehicleId, lat, lng);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vehicles'),
        expect.objectContaining({
          replacements: { vehicle_id: vehicleId, lat, lng },
        })
      );
    });
  });

  describe('getVehicleStatus', () => {
    it('should retrieve vehicle status', async () => {
      const vehicleId = 'vehicle-uuid';
      const mockVehicle = {
        id: vehicleId,
        vehicle_number: 'TRUCK-001',
        kill_switch_status: 'inactive',
        current_driver_name: 'John Doe',
        provider_name: 'samsara',
      };

      sequelize.query.mockResolvedValueOnce([[mockVehicle]]);

      const result = await telematicsService.getVehicleStatus(vehicleId);

      expect(result).toEqual(mockVehicle);
    });

    it('should return null if vehicle not found', async () => {
      const vehicleId = 'invalid-uuid';

      sequelize.query.mockResolvedValueOnce([[]]);

      const result = await telematicsService.getVehicleStatus(vehicleId);

      expect(result).toBeNull();
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalText = 'test-api-key-12345';

      const encrypted = telematicsService.encrypt(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':');

      const decrypted = telematicsService.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input', () => {
      const text = 'test-api-key';

      const encrypted1 = telematicsService.encrypt(text);
      const encrypted2 = telematicsService.encrypt(text);

      // Different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same value
      expect(telematicsService.decrypt(encrypted1)).toBe(text);
      expect(telematicsService.decrypt(encrypted2)).toBe(text);
    });
  });

  describe('logKillSwitchEvent', () => {
    it('should log kill switch event', async () => {
      const vehicleId = 'vehicle-uuid';
      const fleetId = 'fleet-uuid';
      const reportId = 'report-uuid';
      const eventType = 'engaged';
      const userId = 'user-uuid';
      const reason = 'Test reason';
      const lat = 40.7128;
      const lng = -74.0060;

      sequelize.query.mockResolvedValueOnce([]);

      await telematicsService.logKillSwitchEvent(
        vehicleId,
        fleetId,
        reportId,
        eventType,
        userId,
        reason,
        lat,
        lng
      );

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO kill_switch_events'),
        expect.objectContaining({
          replacements: expect.objectContaining({
            vehicle_id: vehicleId,
            event_type: eventType,
          }),
        })
      );
    });
  });
});
