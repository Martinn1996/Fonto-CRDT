const createRootNode = require('./src/createRootNode');
const failedTests = require('./src/failedTests');
const runTestSuite = require('./src/runTestSuite');
const fs = require('fs');
const operations = require('./src/operations');

describe('test', () => {
	before(() => {
		failedTests.initialCRDTState = {};
		failedTests.failedTests = [];
	});
	runTestSuite([createRootNode()], 1, operations);
	// testInitial([createDefaultRootTestNodeInitial()], 10);

	after(() => {
		fs.writeFile(
			'generateTestcases/data/failedTests.json',
			JSON.stringify(failedTests, null, 4),
			function(err) {
				if (err) return console.error(err);
			}
		);
	});
});
