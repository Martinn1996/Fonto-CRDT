const operations = require('./operations');
const Logoot = require('../src/logoot');
const TestNode = require('./TestNode');

const initialCRDT = new Logoot('initial');
const blocks = [];
for (let i = 0; i < 3; i++) {
	blocks.push(initialCRDT.insertBlock(i).blockId);
	const base = 3 * i;
	const content = '' + base + '' + (base + 1) + '' + (base + 2);
	initialCRDT.insertContentInBlock(content, 0, blocks[i]);
}

const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

// rootTestNode.generateOperations(operations, rootTestNode.crdt1, rootTestNode.blocks1);
rootTestNode.createChildNodes(operations);
