const fs = require('fs');
const Logoot = require('../src/logoot');
const executeOperation = require('./src/executeOperation');
const TestNode = require('./src/TestNode');

function createTestNodeFromState(state) {
	const crdt = new Logoot('crdt1');
	crdt.setState(state);
	return new TestNode(crdt, crdt, [], [], []);
}

async function runTestCases(traceCodes) {
	let data = fs.readFileSync('generateTestcases/data/base case test on plain text crdt.json', {
		encoding: 'utf8',
		flag: 'r'
	});
	data = JSON.parse(data);
	const startNode = createTestNodeFromState(data.initialCRDTState);

	for (const hashedTrace of traceCodes) {
		const trace = data.failedTests[hashedTrace];
		const node = startNode.copy();
		for (const operation of trace.trace) {
			executeOperation(node, operation);
		}
	}
}

describe('test', () => {
	runTestCases(['bb19de1747780c6974f685a12ae01278']);
});
