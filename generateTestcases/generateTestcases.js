const operations = require('./operations');
const Logoot = require('../src/logoot');
const TestNode = require('./TestNode');
const failedTests = require('./failedTests');
const fs = require('fs');

function createRootTestNode() {
	const initialCRDT = new Logoot('initial');
	const blocks = [];
	for (let i = 0; i < 3; i++) {
		blocks.push(initialCRDT.insertBlock(i).blockId);
		const base = 3 * i;
		const content = '' + base + '' + (base + 1) + '' + (base + 2);
		initialCRDT.insertContentInBlock(content, 0, blocks[i]);
	}
	failedTests.initialCRDTState = initialCRDT.getState();
	const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

	return rootTestNode;
}

function test(nodesInLayer, treeLevel) {
	console.error = () => {};
	if (treeLevel === 0) return nodesInLayer;
	let res = [];
	let count = 0;
	for (const testNode of nodesInLayer) {
		count++;
		res = res.concat(testNode.createChildNodes(operations));
		console.log(treeLevel, count, '/', nodesInLayer.length);
	}
	test(res, treeLevel - 1);
}

describe('test', () => {
	test([createRootTestNode()], 1);

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
