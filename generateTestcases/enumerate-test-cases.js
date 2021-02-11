const createTestSuite = require('./src/createTestSuite');
const parser = require('./testSuites/parser');

const testSuites = parser();

for (const testSuite of testSuites) {
	try {
		createTestSuite(
			testSuite.name,
			testSuite.operations,
			testSuite.actionCount,
			testSuite.prunePercentage,
			testSuite.startState
		);
	} catch (e) {
		console.log(e);
	}
}
