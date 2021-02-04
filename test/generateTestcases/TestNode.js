const { Test } = require('mocha');
const Logoot = require('../../src/logoot');

class TestNode {
	constructor(CRDT1, CRDT2, blocks1, blocks2, ops1, ops2) {
		this.crdt1 = new Logoot('crdt1');
		this.crdt2 = new Logoot('crdt2');

		this.crdt1.setState(CRDT1.getState());
		this.crdt2.setState(CRDT2.getState());

		this.blocks1 = this.deepCopyArray(blocks1);
		this.blocks2 = this.deepCopyArray(blocks2);

		this.ops1 = this.deepCopyArray(ops1);
		this.ops2 = this.deepCopyArray(ops2);

		this.crdt1.on('operation', op => {
			this.ops2.push(op);
		});

		this.crdt2.on('operation', op => {
			this.ops1.push(op);
		});
	}

	copy() {
		return new TestNode(
			this.crdt1,
			this.crdt2,
			this.blocks1,
			this.blocks2,
			this.ops1,
			this.ops2
		);
	}

	createChildNodes(operations) {
		const childNodesAsObject = this.generateOperationsForBothCRDTs(operations);
		for (const operationPair of childNodesAsObject) {
			const node = this.copy();
		}
	}

	generateOperationsForBothCRDTs(operations) {
		const operationsCRDT1 = this.generateOperationsForOneCRDT(
			operations,
			this.crdt1,
			this.blocks1
		);
		const operationsCRDT2 = this.generateOperationsForOneCRDT(
			operations,
			this.crdt2,
			this.blocks2
		);

		const res = [];

		for (const operationCRDT1 of operationsCRDT1) {
			for (const operationCRDT2 of operationsCRDT2) {
				res.push({
					operationCRDT1,
					operationCRDT2,
					sync: true
				});

				res.push({
					operationCRDT1,
					operationCRDT2,
					sync: false
				});
			}
		}
		return res;
	}


	generateOperationsForOneCRDT(operations, logoot, blocks) {
		let possibleOperations = [{ type: 'idle' }];
		for (const f of operations) {
			possibleOperations = possibleOperations.concat(f(logoot, blocks));
		}
		return possibleOperations;
	}

	deepCopyArray(arr) {
		const res = [];
		for (const e of arr) {
			res.push(e);
		}

		return res;
	}
}

module.exports = TestNode;
