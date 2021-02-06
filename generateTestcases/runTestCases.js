const fs = require('fs');
const Logoot = require('../src/logoot');
const executeOperation = require('./executeOperation');
const TestNode = require('./TestNode');

function createTestNodeFromState(state) {
	const crdt = new Logoot('crdt1');
	crdt.setState(state);
	return new TestNode(crdt, crdt, [], [], []);
}

async function runTestCases(traceCodes) {
	let data = fs.readFileSync('generateTestcases/data/failedTests.json', {
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
	runTestCases(['5e2f145b6d6e8627f5efeafd30be83f1', '871eb4d227589e8e89d5cc94099beacf']);
});
