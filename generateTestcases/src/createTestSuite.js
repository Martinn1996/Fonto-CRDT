const createRootNode = require('./createRootNode');
const failedTests = require('./failedTests');
const runTestSuite = require('./runTestSuite');

const fs = require('fs');

function createTestSuite(name, operations, actionCount, prunePercentage, state) {
	describe(name, () => {
		const testNode = createRootNode(state);

		before(() => {
			failedTests.initialCRDTState = testNode.crdt1.getState();
			failedTests.failedTests = [];
		});

		runTestSuite([testNode], actionCount, operations, prunePercentage);

		after(() => {
			console.log(failedTests)

			fs.writeFile(
				`generateTestcases/data/${name}.json`,
				JSON.stringify(failedTests, null, 4),
				function(err) {
					if (err) return console.error(err);
				}
			);
		});
	});
}

module.exports = createTestSuite;
