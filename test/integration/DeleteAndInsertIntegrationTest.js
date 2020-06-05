const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Delete and Insert Block Integration', () => {
	let crdt1;
	let crdt2;

	/**
	 * Function to create a new block and insert text
	 * @param {*} crdt which inserts
	 * @param {*} value to insert
	 * @param {*} index of block
	 * @return {*} id of block
	 */
	function insertContentInNewBlock(crdt, value, index) {
		const block = crdt.insertBlock(index);
		crdt.insertContentInBlock(value, 0, block.blockId);
		return block.blockId;
	}

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

	it('should insert 100 blocks and delete 50 blocks', () => {
		const blockIndexes = [];
		for (let i = 0; i < 100; i++) {
			const block = crdt1.insertBlock(i);
			blockIndexes.push(block.blockId);
		}

		for (let i = 0; i < 50; i++) {
			crdt1.deleteBlock(blockIndexes[i]);
		}

		assert.equal(crdt1.length(), 50);
	});

	it('should insert 20 blocks and delete 10 blocks and not change order', () => {
		const blockIndexes = [];
		for (let i = 0; i <= 20; i++) {
			const blockId = insertContentInNewBlock(crdt1, '' + i, i);
			blockIndexes.push(blockId);
		}

		for (let i = 1; i < 20; i += 2) {
			crdt1.deleteBlock(blockIndexes[i]);
		}
		assert.equal(
			crdt1.value(),
			'0\n\n2\n\n4\n\n6\n\n8\n\n10\n\n12\n\n14\n\n16\n\n18\n\n20\n\n'
		);
	});

	it('should insert 1000 blocks and delete the first block added', () => {
		let blockIndex = '';
		for (let i = 0; i < 1000; i++) {
			const blockId = insertContentInNewBlock(crdt1, 'a', 0);
			if (i === 0) {
				blockIndex = blockId;
			}
		}

		crdt2.deleteBlock(blockIndex);
		assert.equal(crdt1.value().length, 2997);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should insert 2 blocks on replica1 and delete 1 on replica2', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertBlock(1);
		crdt2.deleteBlock(block.blockId);

		assert.equal(crdt1.length(), 1);
	});

	it('should insert 2 blocks on replica1 and delete the first block on replica2', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'block1', 0);
		insertContentInNewBlock(crdt1, 'block2', 1);
		crdt2.deleteBlock(blockId1);

		assert.equal(crdt1.value(), 'block2\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
		assert.equal(crdt1.length(), 1);
	});

	it('should insert 3 blocks with text and delete the middle block with text', () => {
		insertContentInNewBlock(crdt1, 'blok1', 0);
		const blockId2 = insertContentInNewBlock(crdt1, 'blok2', 1);
		insertContentInNewBlock(crdt1, 'blok3', 2);

		crdt1.deleteBlock(blockId2);
		assert.equal(crdt1.value(), 'blok1\n\nblok3\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should insert 2 paragraphs on replica 1, 2 paragraphs on replica 2 and replica 2 adjust one of replica 1 paragraphs and they should converge', () => {
		const block1 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('Vandaag is vrijdag', 0, block1.blockId);
		const block2 = crdt2.insertBlock(1);
		crdt2.insertContentInBlock('Het is mooi weer', 0, block2.blockId);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('Ik ga vandaag tenissen', 0, block3.blockId);
		const block4 = crdt2.insertBlock(1);
		crdt2.insertContentInBlock('Ik ben vrij vandaag', 0, block4.blockId);
		crdt2.deleteContentInBlock(11, 7, block1.blockId);
		crdt2.insertContentInBlock('maandag', 11, block1.blockId);

		assert.equal(
			crdt1.value(),
			'Vandaag is maandag\n\nIk ben vrij vandaag\n\nHet is mooi weer\n\nIk ga vandaag tenissen\n\n'
		);
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
