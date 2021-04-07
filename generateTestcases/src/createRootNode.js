const Logoot = require('../../src/logoot');
const TestNode = require('./TestNode');

// eslint-disable-next-line valid-jsdoc
/**
 * Creates Logoot instance with following value:
 * 012
 *
 * 345
 *
 * 678
 * @return crdt with default content
 */
function defaultCRDT() {
	const logoot = new Logoot('initial');

	const blocks = [];

	for (let i = 0; i < 3; i++) {
		blocks.push(logoot.insertBlock(i).blockId);
		const base = 3 * i;
		const content = '' + base + '' + (base + 1) + '' + (base + 2);
		logoot.insertContentInBlock(content, 0, blocks[i]);
	}
	return logoot;
}

function setState(state) {
	const logoot = new Logoot('initial');
	logoot.setState(state);
	return logoot;
}
module.exports = state => {
	let initialCRDT;
	if (!state) {
		initialCRDT = defaultCRDT();
	} else {
		initialCRDT = setState(state);
	}
	const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

	return rootTestNode;
};
