const photos = Array.from({ length: 10 }, (_, i) => ({
  id: `photo-${i}`,
  report_id: `report-${i}`,
  fleet_id: `fleet-${i}`,
  file_key: `key-${i}.jpg`
}));

async function validateImage(id, reportId, fleetId, fileKey) {
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  return { status: 'valid', validationId: `val-${id}` };
}

/**
 * CURRENT IMPLEMENTATION (Sequential)
 */
async function batchValidateImagesSequential(photos) {
  const results = [];

  for (const photo of photos) {
    try {
      const result = await validateImage(
        photo.id,
        photo.report_id,
        photo.fleet_id,
        photo.file_key
      );
      results.push({ photoId: photo.id, success: true, result });
    } catch (error) {
      results.push({ photoId: photo.id, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * OPTIMIZED IMPLEMENTATION (Concurrent)
 */
async function batchValidateImagesConcurrent(photos) {
  return Promise.all(photos.map(async (photo) => {
    try {
      const result = await validateImage(
        photo.id,
        photo.report_id,
        photo.fleet_id,
        photo.file_key
      );
      return { photoId: photo.id, success: true, result };
    } catch (error) {
      return { photoId: photo.id, success: false, error: error.message };
    }
  }));
}

async function runBenchmark() {
  console.log(`Starting benchmark with ${photos.length} photos...`);

  console.log('\n--- Sequential (Current) ---');
  const startSeq = Date.now();
  const resultsSeq = await batchValidateImagesSequential(photos);
  const durationSeq = Date.now() - startSeq;
  console.log(`Duration: ${durationSeq}ms`);

  console.log('\n--- Concurrent (Optimized) ---');
  const startCon = Date.now();
  const resultsCon = await batchValidateImagesConcurrent(photos);
  const durationCon = Date.now() - startCon;
  console.log(`Duration: ${durationCon}ms`);

  console.log('\n--- Verification ---');
  const match = JSON.stringify(resultsSeq) === JSON.stringify(resultsCon);
  console.log(`Results match: ${match}`);
  if (!match) {
    console.log('Seq:', JSON.stringify(resultsSeq, null, 2));
    console.log('Con:', JSON.stringify(resultsCon, null, 2));
  }

  console.log(`\nImprovement: ${((durationSeq - durationCon) / durationSeq * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);
