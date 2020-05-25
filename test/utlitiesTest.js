const util = require('../test/testUtilities');
const assert = require('chai').assert;

describe('utilitiesTest', () => {
	beforeEach(() => {
		util.createCRDT();
		util.createCRDT();
	});

	afterEach(() => {
		util.reset();
	});

	it('should converge after splitting a block while someone is working', () => {
		const blockID = util.insertContentInNewBlock(util.crdt(1), 'Voor de split Na de split', 0);
		util.crdt(2).insertContentInBlock('text aan het einde', 25, blockID);
		util.crdt(1).splitBlock(blockID);

		assert.equal(util.crdt(1).value(), util.crdt(2).value());
		assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	});

	it('should converge after 2 replicas insert new blocks offline and come online', () => {
		util.setAllOffline();

		util.insertContentInNewBlock(util.crdt(1), 'replica1', 0);
		util.insertContentInNewBlock(util.crdt(2), 'replica2', 0);

		assert.equal(util.getOperations(1).length, 9);
		assert.equal(util.getOperations(2).length, 9);

		util.setAllOnline();
		assert.equal(util.crdt(1).value(), util.crdt(2).value());
		assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	});

	// it('test delays when inserting text', () => {
	// 	const block = util.crdt(2).insertBlock(0);
	// 	util.setDelay(2, 1);
	// 	util.crdt(1).insertContentInBlock('zonder delay', 0, block.blockId);
	// 	util.crdt(2).insertContentInBlock('met delay', 0, block.blockId);

	// 	assert.equal(util.crdt(1).value(), 'zonder delay met delay\n\n');
	// 	assert.equal(util.crdt(1).value(), util.crdt(2).value());
	// 	assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	// });
});
