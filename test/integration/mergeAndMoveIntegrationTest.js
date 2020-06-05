const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Merge and Move Block Integration', () => {
	let crdt1;
	let crdt2;

	beforeEach(() => {
		crdt1 = new Logoot('crdt1');
		crdt2 = new Logoot('crdt2');
		crdt1.on('operation', op => {
			crdt2.receive(op);
		});
		crdt2.on('operation', op => {
			crdt1.receive(op);
		});
	});

	it('should converge when two blocks are merged and the block is moved', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);
		const block4 = crdt1.insertBlock(3);

		crdt1.insertContentInBlock('B1', 0, block1.blockId);
		crdt1.insertContentInBlock('B2', 0, block2.blockId);
		crdt1.insertContentInBlock('B3', 0, block3.blockId);
		crdt1.insertContentInBlock('B4', 0, block4.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.moveBlock(block1.blockId, 2);

		assert.equal(crdt1.value(), 'B3\n\nB1B2\n\nB4\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});

describe('Merge and Move Block Integration Offline', () => {
	let crdt1, crdt2, ops1, ops2;

	beforeEach(() => {
		crdt1 = new Logoot('crdt1');
		crdt2 = new Logoot('crdt2');
		ops1 = [];
		ops2 = [];
		crdt1.on('operation', op => {
			ops2.push(op);
		});
		crdt2.on('operation', op => {
			ops1.push(op);
		});
	});

	// it('should converge when trying to move a merged block', () => {
	// 	const block1 = crdt1.insertBlock(0);
	// 	const block2 = crdt1.insertBlock(1);
	// 	const block3 = crdt1.insertBlock(2);
	// 	const block4 = crdt1.insertBlock(3);

	// 	crdt1.insertContentInBlock('B1', 0, block1.blockId);
	// 	crdt1.insertContentInBlock('B2', 0, block2.blockId);
	// 	crdt1.insertContentInBlock('B3', 0, block3.blockId);
	// 	crdt1.insertContentInBlock('B4', 0, block4.blockId);

	// 	ops1.forEach(op => crdt1.receive(op));
	// 	ops2.forEach(op => crdt2.receive(op));
	// 	ops1 = [];
	// 	ops2 = [];

	// 	crdt1.mergeBlocks(block1.blockId, block2.blockId);
	// 	crdt2.moveBlock(block2.blockId, 4);

	// 	ops1.forEach(op => crdt1.receive(op));
	// 	ops2.forEach(op => crdt2.receive(op));
	// 	ops1 = [];
	// 	ops2 = [];
	// 	console.log(crdt1.value());

	// 	console.log(crdt2.value());

	// 	assert.equal(crdt1.value(), 'B1B2\n\nB3\n\nB4\n\n');
	// 	assert.equal(crdt1.value(), crdt2.value());
	// 	assert.equal(crdt1.getState(), crdt2.getState());
	// });
});
