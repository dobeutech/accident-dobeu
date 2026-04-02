const exportService = require('./src/services/exportService');
const { sequelize } = require('./src/database/connection');

// Mock sequelize.query to simulate network latency
const originalQuery = sequelize.query;
let queryCount = 0;

sequelize.query = async function(sql, options) {
  queryCount++;
  // simulate 10ms DB latency
  await new Promise(resolve => setTimeout(resolve, 10));

  if (sql.includes('accident_reports')) {
    const reports = [];
    // 50 reports
    for (let i = 1; i <= 50; i++) {
      reports.push({
        id: i,
        fleet_id: 1,
        report_number: `RPT-${i}`,
        created_at: new Date()
      });
    }
    return [reports, {}];
  } else if (sql.includes('report_photos')) {
    const photos = [];
    if (options.replacements && options.replacements.report_id) {
       photos.push({id: 1, report_id: options.replacements.report_id, url: 'test.jpg'});
    } else if (options.replacements && options.replacements.report_ids) {
       for (const id of options.replacements.report_ids) {
           photos.push({id: 1, report_id: id, url: 'test.jpg'});
       }
    }
    return [photos, {}];
  } else if (sql.includes('report_audio')) {
    const audio = [];
    if (options.replacements && options.replacements.report_id) {
       audio.push({id: 1, report_id: options.replacements.report_id, url: 'test.mp3'});
    } else if (options.replacements && options.replacements.report_ids) {
       for (const id of options.replacements.report_ids) {
           audio.push({id: 1, report_id: id, url: 'test.mp3'});
       }
    }
    return [audio, {}];
  }
  return [[], {}];
};

async function run() {
  console.log('Starting benchmark...');
  queryCount = 0;
  const start = Date.now();
  await exportService.exportReports(1, 'json');
  const end = Date.now();
  console.log(`Time taken: ${end - start}ms`);
  console.log(`Queries executed: ${queryCount}`);
  process.exit(0);
}

run();
