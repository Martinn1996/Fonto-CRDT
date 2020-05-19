const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Insert Block', () => {
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

	// it('should create a new block node when inserting', () => {
	// 	let blockId = crdt1.insertContentInBlock('b1', 0);
	// 	let blockId2 = crdt1.insertContentInBlock('b2', 0);
	// 	let blockId3 = crdt1.insertContentInNewBlock('A', 0, blockId, blockId2);
	// 	let blockId4 = crdt1.insertContentInNewBlock('CAS', 0, null, null);

	// 	// crdt1.insertBlock('a', 0, blockId);
	// 	// crdt1.insertBlock('a', 0, blockId2);

	// 	console.log(crdt1.getState());
	// 	console.log(crdt1.value());
	// 	assert.equal('', '');
	// });

	it('should create a new block node when inserting', () => {
		// let blockId = crdt1.insertContentInBlock('b1', 0);
		// let blockId2 = crdt1.insertContentInBlock('b1', 0);
		let blockId = crdt1.insertBlock(null).blockId;
		let blockId2 = crdt1.insertBlock(1000).blockId;

		let block3 = crdt1.insertContentInNewBlock('cas', 4);
		// let blockId3 = crdt1.insertBlock(blockId, blockId2).blockId;
		// let blockId4 = crdt1.insertBlock(blockId, blockId3).blockId;

		crdt1.insertContentInBlock('block1', 0, blockId);
		crdt1.insertContentInBlock('block2', 0, blockId2);

		// console.log('1', blockId, '2', blockId2, '3', blockId3, '4', blockId4);
		console.log('1', blockId, '2', blockId2, '3', block3.blockId);

		// crdt1.insertContentInBlock('block 3', 0, blockId3);


		console.log(crdt1.getState());
		console.log(crdt1.value());
		assert.equal('', '');
	});
});
