/* eslint-disable no-console */
const operations = require('./src/operations');
const initialOperations = require('./src/initialOperations');
const Logoot = require('../src/logoot');
const TestNode = require('./src/TestNode');
const failedTests = require('./src/failedTests');
const fs = require('fs');
const _ = require('underscore');

function createDefaultRootTestNode() {
	const initialCRDT = new Logoot('initial');
	const blocks = [];
	for (let i = 0; i < 3; i++) {
		blocks.push(initialCRDT.insertBlock(i).blockId);
		const base = 3 * i;
		const content = '' + base + '' + (base + 1) + '' + (base + 2);
		initialCRDT.insertContentInBlock(content, 0, blocks[i]);
	}
	failedTests.initialCRDTState = initialCRDT.getState();
	const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

	return rootTestNode;
}

function test(nodesInLayer, treeLevel) {
	console.error = () => {};
	if (treeLevel === 0) return nodesInLayer;
	let res = [];
	let count = 0;
	for (const testNode of nodesInLayer) {
		count++;
		res = res.concat(testNode.createChildNodes(operations));
		console.log(treeLevel, count, '/', nodesInLayer.length);
	}
	test(res, treeLevel - 1);
}

function createDefaultRootTestNodeInitial() {
	const initialCRDT = new Logoot('initial');
	for (let i = 0; i < 3; i++) {
		const base = 3 * i + '';
		initialCRDT.insert(base, i);
	}
	failedTests.initialCRDTState = initialCRDT.getState();
	const rootTestNode = new TestNode(initialCRDT, initialCRDT, [], [], []);

	return rootTestNode;
}

function factorial(n) {
	let answer = 1;
	if (n === 0 || n === 1) {
		return answer;
	}

	for (let i = n; i >= 1; i--) {
		answer = answer * i;
	}
	return answer;
}

function testInitial(nodesInLayer, treeLevel) {
	console.error = () => {};
	if (treeLevel === 0) return nodesInLayer;
	let res = [];
	let count = 0;
	for (const testNode of nodesInLayer) {
		count++;
		res = res.concat(testNode.createChildNodes(initialOperations));
		res = _.sample(res, res.length / factorial(count));

		console.log(treeLevel, count, '/', nodesInLayer.length);
	}

	testInitial(res, treeLevel - 1);
}

describe('test', () => {
	test([createDefaultRootTestNode()], 1);
	testInitial([createDefaultRootTestNodeInitial()], 10);

	after(() => {
		fs.writeFile(
			'generateTestcases/data/failedTests.json',
			JSON.stringify(failedTests, null, 4),
			function(err) {
				if (err) return console.error(err);
			}
		);
	});
});
