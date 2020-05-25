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
		util.crdt(2).insertContentInBlock('text aan het einde', blockID);
		util.crdt(1).splitBlock(blockID);

		assert.equal(util.crdt(1).value(), util.crdt(2).value());
		assert.deepEqual(util.crdt(1).getState(), util.crdt(2).getState());
	});
});
