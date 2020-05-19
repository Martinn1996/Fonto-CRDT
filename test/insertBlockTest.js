const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Insert', () => {
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
	// 	crdt1.insertContentInNewBlock('a', 0);
	// 	assert.equal(crdt1.value(), 'a');
	// });

	// it('should create a new block node at the start when inserting when there is already another block', () => {
	// 	crdt1.insertContentInNewBlock('a', 0);
	// 	crdt1.insertContentInNewBlock('b', 0);
	// 	assert.equal(crdt1.value(), 'ba');
	// });

	// it('should add a block at start, end and inbetween', () => {
	// 	crdt1.insertContentInNewBlock('a', 0);
	// 	crdt1.insertContentInNewBlock('c', 1);
	// 	crdt1.insertContentInNewBlock('b', 1);

	// 	assert.equal(crdt1.value(), 'abc');
	// });

	// it('should create a new block and insert text in that block', () => {
	// 	const blockId = crdt1.insertContentInNewBlock('Hallo', 0);
	// 	crdt1.insertContentInBlock(' Meneer', 5, blockId);

	// 	assert.equal(crdt1.value(), 'Hallo Meneer');
	// });

	it('should add a block and converge', () => {
		crdt1.insertContentInNewBlock('a', 0);

		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should add a new block and insert text in that block and converge', () => {
		const blockId = crdt1.insertContentinNewBlock('Hallo', 0);
		crdt1.insertContentInBlock(' Meneer', 5, blockId);

		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should add a block at start, end and inbetween and converge', () => {
		crdt1.insertContentInNewBlock('a', 0);
		crdt1.insertContentInNewBlock('c', 1);
		crdt1.insertContentInNewBlock('b', 1);

		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});
