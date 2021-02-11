const operations = require('./src/operations');
const initialOperations = require('./src/initialOperations');

const createTestSuite = require('./src/createTestSuite');
const TestNode = require('./src/TestNode');
const Logoot = require('../src/logoot');

function createDefaultRootTestNodeInitial() {
	const initialCRDT = new Logoot('initial');
	for (let i = 0; i < 3; i++) {
		const base = 3 * i + '';
		initialCRDT.insert(base, i);
	}
	const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

	return rootTestNode;
}
// createTestSuite('test-all-cases', operations, 1);
createTestSuite(
	'test-basic case',
	initialOperations,
	10,
	0.9,
	createDefaultRootTestNodeInitial().crdt1.getState()
);
