const fs = require('fs');
const Logoot = require('../src/logoot');
const executeOperation = require('./src/executeOperation');
const TestNode = require('./src/TestNode');

const file = 'test all operations with 1 action per crdt.json';
const testCases = ['7dd2201bfc061ad55ded63a27369a590', '5d35b8476f3c6e4b2e5d22fbcfff5160'];

function createTestNodeFromState(state) {
	const crdt = new Logoot('crdt1');
	crdt.setState(state);
	return new TestNode(crdt, crdt, [], [], []);
}

async function runTestCases(traceCodes) {
	let data = fs.readFileSync(`generateTestcases/data/${file}`, {
		encoding: 'utf8',
		flag: 'r'
	});
	data = JSON.parse(data);
	const startNode = createTestNodeFromState(data.initialCRDTState);

	for (const hashedTrace of traceCodes) {
		const trace = data.failedTests[hashedTrace];
		const node = startNode.copy();
		for (const operation of trace.trace) {
			if (operation.operation) executeOperation(node, operation.operation);
		}
	}
}

describe('test', () => {
	runTestCases(testCases);
});
