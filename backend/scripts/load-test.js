#!/usr/bin/env node

/**
 * Load Testing Script using autocannon
 * Usage: node scripts/load-test.js [options]
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  url: process.env.TEST_URL || 'http://localhost:3000',
  connections: parseInt(process.env.CONNECTIONS) || 10,
  duration: parseInt(process.env.DURATION) || 30,
  pipelining: parseInt(process.env.PIPELINING) || 1,
  workers: parseInt(process.env.WORKERS) || 4
};

// Test scenarios
const scenarios = {
  health: {
    title: 'Health Check Endpoint',
    url: `${config.url}/health`,
    method: 'GET'
  },
  
  healthDetailed: {
    title: 'Detailed Health Check',
    url: `${config.url}/health/detailed`,
    method: 'GET'
  },
  
  metrics: {
    title: 'Metrics Endpoint',
    url: `${config.url}/health/metrics`,
    method: 'GET'
  },
  
  login: {
    title: 'Login Endpoint',
    url: `${config.url}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    })
  }
};

// Run a single test
async function runTest(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${scenario.title}`);
  console.log(`URL: ${scenario.url}`);
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);
  console.log('='.repeat(60));

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: scenario.url,
      connections: config.connections,
      duration: config.duration,
      pipelining: config.pipelining,
      workers: config.workers,
      method: scenario.method || 'GET',
      headers: scenario.headers || {},
      body: scenario.body || undefined
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

// Format results
function formatResults(result) {
  const { requests, latency, throughput, errors, timeouts, non2xx } = result;
  
  return {
    summary: {
      totalRequests: requests.total,
      requestsPerSecond: requests.average,
      duration: result.duration,
      errors: errors,
      timeouts: timeouts,
      non2xx: non2xx
    },
    latency: {
      average: latency.mean,
      p50: latency.p50,
      p75: latency.p75,
      p90: latency.p90,
      p95: latency.p95,
      p99: latency.p99,
      max: latency.max
    },
    throughput: {
      average: throughput.mean,
      p50: throughput.p50,
      p95: throughput.p95,
      max: throughput.max
    }
  };
}

// Print results
function printResults(scenario, result) {
  const formatted = formatResults(result);
  
  console.log(`\n📊 Results for: ${scenario.title}`);
  console.log('\nSummary:');
  console.log(`  Total Requests: ${formatted.summary.totalRequests}`);
  console.log(`  Requests/sec: ${formatted.summary.requestsPerSecond.toFixed(2)}`);
  console.log(`  Duration: ${formatted.summary.duration}s`);
  console.log(`  Errors: ${formatted.summary.errors}`);
  console.log(`  Timeouts: ${formatted.summary.timeouts}`);
  console.log(`  Non-2xx: ${formatted.summary.non2xx}`);
  
  console.log('\nLatency (ms):');
  console.log(`  Average: ${formatted.latency.average.toFixed(2)}`);
  console.log(`  p50: ${formatted.latency.p50}`);
  console.log(`  p75: ${formatted.latency.p75}`);
  console.log(`  p90: ${formatted.latency.p90}`);
  console.log(`  p95: ${formatted.latency.p95}`);
  console.log(`  p99: ${formatted.latency.p99}`);
  console.log(`  Max: ${formatted.latency.max}`);
  
  console.log('\nThroughput (bytes/sec):');
  console.log(`  Average: ${(formatted.throughput.average / 1024).toFixed(2)} KB/s`);
  console.log(`  p95: ${(formatted.throughput.p95 / 1024).toFixed(2)} KB/s`);
  console.log(`  Max: ${(formatted.throughput.max / 1024).toFixed(2)} KB/s`);
  
  // Performance assessment
  console.log('\n📈 Performance Assessment:');
  if (formatted.latency.p95 < 500) {
    console.log('  ✅ Excellent - p95 latency under 500ms');
  } else if (formatted.latency.p95 < 1000) {
    console.log('  ⚠️  Good - p95 latency under 1s');
  } else {
    console.log('  ❌ Poor - p95 latency over 1s');
  }
  
  if (formatted.summary.errors === 0 && formatted.summary.timeouts === 0) {
    console.log('  ✅ No errors or timeouts');
  } else {
    console.log(`  ❌ ${formatted.summary.errors} errors, ${formatted.summary.timeouts} timeouts`);
  }
}

// Save results to file
function saveResults(allResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `load-test-results-${timestamp}.json`;
  const filepath = path.join(__dirname, '../logs', filename);
  
  fs.writeFileSync(filepath, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Results saved to: ${filepath}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Load Tests...');
  console.log(`Target: ${config.url}`);
  console.log(`Configuration: ${config.connections} connections, ${config.duration}s duration\n`);
  
  const allResults = [];
  
  // Run tests sequentially
  for (const [key, scenario] of Object.entries(scenarios)) {
    try {
      const result = await runTest(scenario);
      const formatted = formatResults(result);
      
      allResults.push({
        scenario: scenario.title,
        timestamp: new Date().toISOString(),
        ...formatted
      });
      
      printResults(scenario, result);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ Error testing ${scenario.title}:`, error.message);
    }
  }
  
  // Save all results
  saveResults(allResults);
  
  console.log('\n✅ Load testing completed!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTest, formatResults };
