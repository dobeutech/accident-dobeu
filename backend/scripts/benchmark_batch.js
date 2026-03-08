const imageValidationService = require('../src/services/imageValidationService');

async function benchmark() {
  const photos = Array.from({ length: 10 }, (_, i) => ({
    id: `photo-${i}`,
    report_id: `report-${i}`,
    fleet_id: `fleet-${i}`,
    file_key: `key-${i}.jpg`
  }));

  // Mock validateImage to simulate a delay without actual AWS/DB calls
  const originalValidateImage = imageValidationService.validateImage;
  imageValidationService.validateImage = async (id, reportId, fleetId, fileKey) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    return { status: 'valid', validationId: `val-${id}` };
  };

  console.log(`Starting benchmark with ${photos.length} photos...`);
  const start = Date.now();
  const results = await imageValidationService.batchValidateImages(photos);
  const duration = Date.now() - start;

  console.log(`Benchmark completed in ${duration}ms`);
  console.log(`Average time per photo: ${duration / photos.length}ms`);

  // Verify output format
  if (results.length !== photos.length) {
    console.error(`Error: Expected ${photos.length} results, got ${results.length}`);
  }

  const allSuccessful = results.every(r => r.success === true && r.result.status === 'valid');
  if (!allSuccessful) {
    console.error('Error: Some validations failed or have incorrect format');
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('Output format verified successfully.');
  }

  // Restore original validateImage (though not strictly necessary for this script)
  imageValidationService.validateImage = originalValidateImage;
}

benchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
