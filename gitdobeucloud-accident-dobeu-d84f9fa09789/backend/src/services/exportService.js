const { sequelize } = require('../database/connection');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Note: This is a simplified version. Full implementation would require
// additional libraries for DOCX, XML generation, and file compression

class ExportService {
  async exportReports(fleetId, format, reportIds = []) {
    try {
      let whereClause = 'WHERE r.fleet_id = :fleet_id';
      const replacements = { fleet_id: fleetId };
      
      if (reportIds.length > 0) {
        whereClause += ' AND r.id = ANY(:report_ids)';
        replacements.report_ids = reportIds;
      }
      
      const [reports] = await sequelize.query(`
        SELECT r.*, 
               u.first_name || ' ' || u.last_name as driver_name,
               u.email as driver_email,
               u.phone as driver_phone
        FROM accident_reports r
        LEFT JOIN users u ON r.driver_id = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get photos and audio for each report
      for (const report of reports) {
        const [photos] = await sequelize.query(`
          SELECT * FROM report_photos WHERE report_id = :report_id ORDER BY order_index
        `, {
          replacements: { report_id: report.id },
          type: sequelize.QueryTypes.SELECT
        });
        
        const [audio] = await sequelize.query(`
          SELECT * FROM report_audio WHERE report_id = :report_id ORDER BY created_at
        `, {
          replacements: { report_id: report.id },
          type: sequelize.QueryTypes.SELECT
        });
        
        report.photos = photos;
        report.audio = audio;
      }
      
      switch (format) {
        case 'pdf':
          return await this.exportToPDF(reports);
        case 'xlsx':
          return await this.exportToXLSX(reports);
        case 'csv':
          return await this.exportToCSV(reports);
        case 'xml':
          return await this.exportToXML(reports);
        case 'json':
          return await this.exportToJSON(reports);
        case 'zip':
          return await this.exportToZIP(reports);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error('Export service error:', error);
      throw error;
    }
  }
  
  async exportToPDF(reports) {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});
    
    // Add content
    doc.fontSize(20).text('Accident Reports', { align: 'center' });
    doc.moveDown();
    
    reports.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      doc.fontSize(16).text(`Report: ${report.report_number}`);
      doc.fontSize(12);
      doc.text(`Driver: ${report.driver_name || 'N/A'}`);
      doc.text(`Date: ${new Date(report.incident_date).toLocaleString()}`);
      doc.text(`Type: ${report.incident_type}`);
      doc.text(`Status: ${report.status}`);
      doc.moveDown();
      
      if (report.address) {
        doc.text(`Location: ${report.address}`);
      }
      
      if (report.custom_fields && Object.keys(report.custom_fields).length > 0) {
        doc.moveDown();
        doc.text('Additional Information:');
        Object.entries(report.custom_fields).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
      }
      
      if (report.photos && report.photos.length > 0) {
        doc.moveDown();
        doc.text(`Photos: ${report.photos.length} attached`);
      }
    });
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: 'application/pdf',
          filename: `accident-reports-${Date.now()}.pdf`
        });
      });
    });
  }
  
  async exportToXLSX(reports) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Accident Reports');
    
    // Headers
    worksheet.columns = [
      { header: 'Report Number', key: 'report_number', width: 20 },
      { header: 'Driver', key: 'driver_name', width: 25 },
      { header: 'Date', key: 'incident_date', width: 20 },
      { header: 'Type', key: 'incident_type', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Location', key: 'address', width: 30 }
    ];
    
    // Add rows
    reports.forEach(report => {
      worksheet.addRow({
        report_number: report.report_number,
        driver_name: report.driver_name || 'N/A',
        incident_date: new Date(report.incident_date),
        incident_type: report.incident_type,
        status: report.status,
        address: report.address || 'N/A'
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      data: buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `accident-reports-${Date.now()}.xlsx`
    };
  }
  
  async exportToCSV(reports) {
    const headers = ['Report Number', 'Driver', 'Date', 'Type', 'Status', 'Location'];
    const rows = reports.map(report => [
      report.report_number,
      report.driver_name || 'N/A',
      new Date(report.incident_date).toISOString(),
      report.incident_type,
      report.status,
      report.address || 'N/A'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return {
      data: Buffer.from(csv, 'utf-8'),
      contentType: 'text/csv',
      filename: `accident-reports-${Date.now()}.csv`
    };
  }
  
  async exportToXML(reports) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<accident_reports>\n';
    
    reports.forEach(report => {
      xml += '  <report>\n';
      xml += `    <report_number>${this.escapeXml(report.report_number)}</report_number>\n`;
      xml += `    <driver_name>${this.escapeXml(report.driver_name || 'N/A')}</driver_name>\n`;
      xml += `    <incident_date>${new Date(report.incident_date).toISOString()}</incident_date>\n`;
      xml += `    <incident_type>${this.escapeXml(report.incident_type)}</incident_type>\n`;
      xml += `    <status>${this.escapeXml(report.status)}</status>\n`;
      if (report.address) {
        xml += `    <address>${this.escapeXml(report.address)}</address>\n`;
      }
      xml += '  </report>\n';
    });
    
    xml += '</accident_reports>';
    
    return {
      data: Buffer.from(xml, 'utf-8'),
      contentType: 'application/xml',
      filename: `accident-reports-${Date.now()}.xml`
    };
  }
  
  async exportToJSON(reports) {
    const json = JSON.stringify(reports, null, 2);
    
    return {
      data: Buffer.from(json, 'utf-8'),
      contentType: 'application/json',
      filename: `accident-reports-${Date.now()}.json`
    };
  }
  
  async exportToZIP(reports) {
    // Simplified - would need archiver library for full implementation
    // For now, return JSON as placeholder
    return await this.exportToJSON(reports);
  }
  
  escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = new ExportService();

