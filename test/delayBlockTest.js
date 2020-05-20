const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Delay tests', () => {
	let crdt1, crdt2, ops1, ops2;

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
		ops1 = [];
		ops2 = [];

		crdt1.on('operation', op => {
			ops2.push(op);
		});

		crdt2.on('operation', op => {
			ops1.push(op);
		});
	});

    it('should have replica 1 make 2 blocks and merge it while replica2 is adjusting a block', () => {
        const blockId1 = insertContentInNewBlock(crdt1, 'block 1', 0);
        const blockId2 = insertContentInNewBlock(crdt1, 'block 2', 0);

        ops2.forEach(op => crdt2.receive(op));
        crdt2.insertContentInBlock('text voor in block 2');
        crdt1.
    })

	it('should converge when 2 sites receive opperations in different order', () => {
		crdt1.insert('Hallo', 0);
		crdt2.insert('Meneer', 0);

		for (let i = 0; i < Math.floor(ops2.length / 2); i++) {
			crdt2.receive(ops2[0]);
			ops2.shift();
		}

		for (let i = 0; i < Math.floor(ops1.length / 2); i++) {
			crdt1.receive(ops1[0]);
			ops1.shift();
		}

		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites delete and receive opperations in different order', () => {
		crdt1.setValue('Hallo Meneer');
		crdt2.setValue('Hallo Meneer');

		crdt2.delete(6, 11);
		crdt1.delete(0, 3);

		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites insert and receive in different order', () => {
		crdt1.insert('Hal', 0);
		crdt2.insert('Men', 0);
		ops2.forEach(op => crdt2.receive(op));
		ops2 = [];
		ops1.forEach(op => crdt1.receive(op));
		ops1 = [];
		crdt1.insert('lo', 3);
		crdt2.insert('eer', 4);

		ops2.forEach(op => crdt2.receive(op));
		ops2 = [];
		ops1.forEach(op => crdt1.receive(op));
		ops1 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites insert, delete and receive in different order', () => {
		crdt1.insert('Hallo', 0);
		crdt2.insert('Goeiendag', 0);

		for (let i = 0; i < Math.floor(ops2.length / 2); i++) {
			crdt2.receive(ops2[0]);
			ops2.shift();
		}

		for (let i = 0; i < Math.floor(ops1.length / 2); i++) {
			crdt1.receive(ops1[0]);
			ops1.shift();
		}

		crdt1.delete(0, 4);
		crdt2.delete(0, 8);

		for (let i = 0; i < Math.floor(ops2.length / 2); i++) {
			crdt2.receive(ops2[0]);
			ops2.shift();
		}

		for (let i = 0; i < Math.floor(ops1.length / 2); i++) {
			crdt1.receive(ops1[0]);
			ops1.shift();
		}

		crdt1.insert('Hey', 0);
		crdt2.insert('Goeienavond', 0);

		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites insert at different locations and receive in different order', () => {
		crdt1.insert('Hallo', 0);
		crdt2.insert('Goeiendag', 0);

		ops2.forEach(op => crdt2.receive(op));
		ops2 = [];
		ops1.forEach(op => crdt1.receive(op));
		ops1 = [];

		crdt1.insert('Meneer', 5);
		crdt2.insert('Meneer', 9);

		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites insert and delete at different locations and receive in different order', () => {
		crdt1.insert('Hal', 0);
		crdt2.insert('Goeiendag', 0);

		ops2.forEach(op => crdt2.receive(op));
		ops2 = [];

		for (let i = 0; i < Math.floor(ops1.length / 2); i++) {
			crdt1.receive(ops1[0]);
			ops1.shift();
		}

		crdt2.delete(0, 5);
		crdt1.insert('lo', 3);

		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
