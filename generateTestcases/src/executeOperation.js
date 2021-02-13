const deleteBlock = require('./operations/deleteBlock');
const deleteContentInBlock = require('./operations/deleteContentInBlock');
const deleteText = require('./operations/deleteText');
const insert = require('./operations/insert');
const insertBlock = require('./operations/insertBlock');
const insertContentInBlock = require('./operations/insertContentInBlock');
const mergeBlocks = require('./operations/mergeBlocks');
const moveBlock = require('./operations/moveBlock');
const splitBlock = require('./operations/splitBlock');

function executeOnCRDT(crdt, operation) {
	if (operation.type === 'idle') {
		return;
	}
	switch (operation.type) {
		case 'insertBlock':
			insertBlock(crdt, operation.index, operation.blockId);
			break;
		case 'deleteBlock':
			deleteBlock(crdt, operation.blockId);
			break;
		case 'mergeBlocks':
			mergeBlocks(crdt, operation.blockId1, operation.blockId2);
			break;
		case 'splitBlock':
			splitBlock(crdt, operation.blockId, operation.index);
			break;
		case 'moveBlock':
			moveBlock(crdt, operation.blockId, operation.index);
			break;
		case 'insertContentInBlock':
			insertContentInBlock(crdt, operation.blockId, operation.index, operation.text);
			break;
		case 'deleteContentInBlock':
			deleteContentInBlock(crdt, operation.blockId, operation.index);
			break;
		case 'insert':
			insert(crdt, operation.index, operation.text);
			break;
		case 'delete':
			deleteText(crdt, operation.index);
			break;
		default:
			console.log(operation.type, 'is not defined');
	}
}

module.exports = (testNode, operation) => {
	executeOnCRDT(testNode.crdt1, operation.operationCRDT1);
	executeOnCRDT(testNode.crdt2, operation.operationCRDT2);
	const res = {
		operation,
		lastops: [testNode.lastOps1, testNode.lastOps2],
		currentValues: [testNode.crdt1.value(), testNode.crdt2.value()]
	};
	testNode.trace.push(res);
	if (operation.sync) {
		testNode.sync();
	}
};
