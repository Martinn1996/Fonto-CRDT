const deleteBlock = require('./operations/deleteBlock');
const deleteContentInBlock = require('./operations/deleteContentInBlock');
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
			insertBlock(crdt, operation.index);
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
		default:
			console.error(operation.type, 'is not defined');
	}
}

module.exports = (testNode, operation) => {
	executeOnCRDT(testNode.crdt1, operation.operationCRDT1);
	executeOnCRDT(testNode.crdt2, operation.operationCRDT2);
	testNode.trace.push(operation);

	if (operation.sync) {
		testNode.sync();
	}
};
