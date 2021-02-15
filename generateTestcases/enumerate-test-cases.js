const createTestSuite = require('./src/createTestSuite');
const parser = require('./testSuites/parser');

const testSuites = parser();

for (const testSuite of testSuites) {
	// eslint-disable-next-line no-console
	console.log(testSuite.name);
	try {
		createTestSuite(
			testSuite.name,
			testSuite.operations,
			testSuite.actionCount,
			testSuite.prunePercentage,
			testSuite.startState
		);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(e);
	}
}
