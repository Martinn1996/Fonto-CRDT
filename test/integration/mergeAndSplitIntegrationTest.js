// const assert = require('chai').assert;
// const Logoot = require('../../src/logoot');

// describe('Merge and Split Block Integration', () => {
// 	let crdt1;
// 	let crdt2;

// 	beforeEach(() => {
// 		crdt1 = new Logoot('crdt1');
// 		crdt2 = new Logoot('crdt2');
// 		crdt1.on('operation', op => {
// 			crdt2.receive(op);
// 		});
// 		crdt2.on('operation', op => {
// 			crdt1.receive(op);
// 		});
// 	});

// 	it('should converge after someone merges 2 blocks and then splits in first merged block', () => {
// 		const block1 = crdt1.insertBlock(0);
// 		const block2 = crdt1.insertBlock(1);

// 		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
// 		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

// 		crdt1.mergeBlocks(block1.blockId, block2.blockId);
// 		crdt1.splitBlock(block1.blockId, 2);

// 		assert.equal(crdt1.value(), 'Ho\n\niDoei\n\n');
// 		assert.equal(crdt1.value(), crdt2.value());
// 		assert.equal(crdt1.getState(), crdt2.getState());
// 	});
// });
