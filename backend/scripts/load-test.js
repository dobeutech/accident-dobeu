#!/usr/bin/env node

/**
 * Load Testing Script using autocannon
 * Usage: node scripts/load-test.js [options]
 */

const autocannon = require('autocannon');
const LoadTestReporter = require('./reporter');

// Configuration
const config = {
  url: process.env.TEST_URL || 'http://localhost:3000',
  connections: parseInt(process.env.CONNECTIONS) || 10,
  duration: parseInt(process.env.DURATION) || 30,
  pipelining: parseInt(process.env.PIPELINING) || 1,
  workers: parseInt(process.env.WORKERS) || 4
};

// Initialize Reporter
const reporter = new LoadTestReporter(config);

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
  reporter.startScenario(scenario);

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

// Main execution
async function main() {
  reporter.startTest();
  
  // Run tests sequentially
  for (const [key, scenario] of Object.entries(scenarios)) {
    try {
      const result = await runTest(scenario);
      const formatted = formatResults(result);
      
      reporter.reportScenarioResult(scenario, result, formatted);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      reporter.reportScenarioError(scenario, error);
    }
  }
  
  reporter.finishTest();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    reporter.reportFatalError(error);
    process.exit(1);
  });
}

module.exports = { runTest, formatResults };
