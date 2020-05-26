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

	it('test random ordering operations', () => {
		const blockId = util.insertContentInNewBlock(util.crdt(1), 'Blok1', 0);

		util.setAllOffline();

		util.crdt(1).insertContentInBlock('BeginB1 ', 0, blockId);
		util.crdt(2).insertContentInBlock(' EindB1', 6, blockId);

		util.shuffle(util.getOperations(1));
		util.shuffle(util.getOperations(2));

		util.setAllOnline();
		assert.equal(util.crdt(1).value(), util.crdt(2).value());
		assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	});

	// it('test random ordering operations multiple inserts', () => {
	// 	const blockId = util.insertContentInNewBlock(util.crdt(2), 'blok2', 0);

	// 	util.setAllOffline();

	// 	util.crdt(1).insertContentInBlock('c1o1', 0, blockId);
	// 	util.crdt(1).insertContentInBlock('c1o2', 0, blockId);
	// 	util.crdt(1).insertContentInBlock('c1o3', 0, blockId);
	// 	util.crdt(1).insertContentInBlock('c1o4', 0, blockId);
	// 	util.crdt(2).insertContentInBlock('c2o1', 0, blockId);
	// 	util.crdt(2).insertContentInBlock('c2o2', 0, blockId);
	// 	util.crdt(2).insertContentInBlock('c2o3', 0, blockId);
	// 	util.crdt(2).insertContentInBlock('c2o4', 0, blockId);

	// 	util.shuffle(util.getOperations(1));
	// 	util.shuffle(util.getOperations(2));

	// 	util.setAllOnline();
	// 	assert.equal(util.crdt(1).value(), util.crdt(2).value());
	// 	assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	// });
});
