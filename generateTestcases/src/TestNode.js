const Logoot = require('../../src/logoot');
const executeOperation = require('./executeOperation');
const assert = require('chai').assert;
const md5 = require('md5');
const failedTests = require('./failedTests');
class TestNode {
	constructor(CRDT1, CRDT2, ops1, ops2, trace) {
		this.crdt1 = new Logoot('crdt1');
		this.crdt2 = new Logoot('crdt2');

		this.crdt1.setState(CRDT1.getState());
		this.crdt2.setState(CRDT2.getState());

		this.ops1 = this.deepCopyArray(ops1);
		this.ops2 = this.deepCopyArray(ops2);
		this.trace = this.deepCopyArray(trace);
		this.lastOps1 = null;
		this.lastOps2 = null;
		this.crdt1.on('operation', op => {
			this.ops2.push(op);
			this.lastOps1 = op;
		});

		this.crdt2.on('operation', op => {
			this.ops1.push(op);
			this.lastOps2 = op;
		});
	}

	copy() {
		const res = new TestNode(this.crdt1, this.crdt2, this.ops1, this.ops2, this.trace);
		res.crdt1.clock = this.crdt1.clock;
		res.crdt2.clock = this.crdt2.clock;
		return res;
	}

	assertCRDTs() {
		const v1 = this.crdt1.value();
		const v2 = this.crdt2.value();
		it('trace: ' + JSON.stringify(this.trace), () => {
			try {
				assert.equal(v1, v2);
			} catch (e) {
				failedTests.failedTests[md5(JSON.stringify(this.trace))] = {
					valueCRDT1: v1,
					valueCRDT2: v2,
					state1: this.crdt1.getState(),
					state2: this.crdt2.getState(),
					trace: this.trace
				};
				throw new Error(e);
			}
		});
	}

	sync() {
		this.ops1.forEach(op => this.crdt1.receive(op));
		this.ops2.forEach(op => this.crdt2.receive(op));
		this.ops1 = [];
		this.ops2 = [];
		this.trace.push({
			valuesAfterSync: [this.crdt1.value(), this.crdt2.value()]
		});
		this.assertCRDTs();
	}

	createChildNodes(operations) {
		const childNodesAsObject = this.generateOperationsForBothCRDTs(operations);

		return childNodesAsObject.map(operation => {
			const node = this.copy();
			try {
				executeOperation(node, operation);
			} catch (e) {
				it('trace: ' + JSON.stringify(this.trace), () => {
					failedTests.failedTests[md5(JSON.stringify(this.trace))] = {
						valueCRDT1: this.crdt1.value(),
						valueCRDT2: this.crdt1.value(),
						trace: this.trace,
						error: new Error(e)
					};
					throw new Error(e);
				});
			}
			return node;
		});
	}

	generateOperationsForBothCRDTs(operations) {
		const operationsCRDT1 = this.generateOperationsForOneCRDT(operations, this.crdt1);
		const operationsCRDT2 = this.generateOperationsForOneCRDT(operations, this.crdt2);

		const res = [];

		for (const operationCRDT1 of operationsCRDT1) {
			for (const operationCRDT2 of operationsCRDT2) {
				if (operationCRDT2.type === 'mergeBlocks' || operationCRDT2.type === 'splitBlock') {
					continue;
				}
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

	generateOperationsForOneCRDT(operations, logoot) {
		let possibleOperations = [{ type: 'idle' }];
		for (const f of operations) {
			possibleOperations = possibleOperations.concat(f(logoot));
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
