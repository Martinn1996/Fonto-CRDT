const createTestSuite = require('./src/createTestSuite');
const parseOperations = require('./src/parseOperations');
const parser = require('./testSuites/parser');

const operations = parseOperations([
	'generateInsertContentInBlockOperations',
	'generateDeleteContentInBlockOperations',
	'generateInsertBlockOperations',
	'generateDeleteBlockOperations',
	'generateMoveBlockOperations',
	'generateSplitBlockOperations',
	'generateMergeBlockOperations'
]);

const testSuites = parser();

for (const testSuite of testSuites) {
	createTestSuite(
		testSuite.name,
		testSuite.operations,
		testSuite.actionCount,
		testSuite.prunePercentage,
		testSuite.startState
	);
}
