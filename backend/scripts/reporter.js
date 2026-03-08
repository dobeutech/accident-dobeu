const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

class LoadTestReporter {
  constructor(config) {
    this.config = config;
    this.allResults = [];
  }

  startTest() {
    logger.info('🚀 Starting Load Tests...');
    logger.info(`Target: ${this.config.url}`);
    logger.info(`Configuration: ${this.config.connections} connections, ${this.config.duration}s duration\n`);
  }

  startScenario(scenario) {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`Testing: ${scenario.title}`);
    logger.info(`URL: ${scenario.url}`);
    logger.info(`Connections: ${this.config.connections}, Duration: ${this.config.duration}s`);
    logger.info('='.repeat(60));
  }

  reportScenarioResult(scenario, result, formatted) {
    this.allResults.push({
      scenario: scenario.title,
      timestamp: new Date().toISOString(),
      ...formatted
    });

    logger.info(`\n📊 Results for: ${scenario.title}`);
    logger.info('\nSummary:');
    logger.info(`  Total Requests: ${formatted.summary.totalRequests}`);
    logger.info(`  Requests/sec: ${formatted.summary.requestsPerSecond.toFixed(2)}`);
    logger.info(`  Duration: ${formatted.summary.duration}s`);
    logger.info(`  Errors: ${formatted.summary.errors}`);
    logger.info(`  Timeouts: ${formatted.summary.timeouts}`);
    logger.info(`  Non-2xx: ${formatted.summary.non2xx}`);

    logger.info('\nLatency (ms):');
    logger.info(`  Average: ${formatted.latency.average.toFixed(2)}`);
    logger.info(`  p50: ${formatted.latency.p50}`);
    logger.info(`  p75: ${formatted.latency.p75}`);
    logger.info(`  p90: ${formatted.latency.p90}`);
    logger.info(`  p95: ${formatted.latency.p95}`);
    logger.info(`  p99: ${formatted.latency.p99}`);
    logger.info(`  Max: ${formatted.latency.max}`);

    logger.info('\nThroughput (bytes/sec):');
    logger.info(`  Average: ${(formatted.throughput.average / 1024).toFixed(2)} KB/s`);
    logger.info(`  p95: ${(formatted.throughput.p95 / 1024).toFixed(2)} KB/s`);
    logger.info(`  Max: ${(formatted.throughput.max / 1024).toFixed(2)} KB/s`);

    // Performance assessment
    logger.info('\n📈 Performance Assessment:');
    if (formatted.latency.p95 < 500) {
      logger.info('  ✅ Excellent - p95 latency under 500ms');
    } else if (formatted.latency.p95 < 1000) {
      logger.info('  ⚠️  Good - p95 latency under 1s');
    } else {
      logger.info('  ❌ Poor - p95 latency over 1s');
    }

    if (formatted.summary.errors === 0 && formatted.summary.timeouts === 0) {
      logger.info('  ✅ No errors or timeouts');
    } else {
      logger.info(`  ❌ ${formatted.summary.errors} errors, ${formatted.summary.timeouts} timeouts`);
    }
  }

  reportScenarioError(scenario, error) {
    logger.error(`\n❌ Error testing ${scenario.title}:`, error.message);
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-results-${timestamp}.json`;
    const filepath = path.join(__dirname, '../logs', filename);

    fs.writeFileSync(filepath, JSON.stringify(this.allResults, null, 2));
    logger.info(`\n💾 Results saved to: ${filepath}`);
  }

  finishTest() {
    this.saveResults();
    logger.info('\n✅ Load testing completed!');
  }

  reportFatalError(error) {
    logger.error('Fatal error:', error);
  }
}

module.exports = LoadTestReporter;
