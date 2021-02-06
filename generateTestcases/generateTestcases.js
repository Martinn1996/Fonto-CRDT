const operations = require('./operations');
const Logoot = require('../src/logoot');
const TestNode = require('./TestNode');

function createRootTestNode() {
	const initialCRDT = new Logoot('initial');
	const blocks = [];
	for (let i = 0; i < 3; i++) {
		blocks.push(initialCRDT.insertBlock(i).blockId);
		const base = 3 * i;
		const content = '' + base + '' + (base + 1) + '' + (base + 2);
		initialCRDT.insertContentInBlock(content, 0, blocks[i]);
	}

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

// rootTestNode.generateOperations(operations, rootTestNode.crdt1, rootTestNode.blocks1);
// console.log(rootTestNode.createChildNodes(operations));
test([createRootTestNode()], 2);
