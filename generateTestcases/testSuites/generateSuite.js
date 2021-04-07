const fs = require('fs');
const Logoot = require('../../src/logoot');

// Enter name of test suite
const testSuiteName = 'merge and insert block and move block';

// Enter prune percentage
const prunePercentage = 0.97;

// Enter action count
const actionCount = 2;

// Comment out which one you do not want to test
const operations = [
	// 'generateInsertContentInBlockOperations',
	// 'generateDeleteContentInBlockOperations',
	'generateInsertBlockOperations',
	// 'generateDeleteBlockOperations',
	'generateMoveBlockOperations',
	// 'generateSplitBlockOperations',
	'generateMergeBlockOperations'
];

const res = {
	name: testSuiteName,
	prunePercentage,
	actionCount,
	operations
};

// eslint-disable-next-line no-unused-vars
function createInitialCRDT(instance) {
	const logoot = new Logoot('initial');

	const blocks = [];

	for (let i = 0; i < 3; i++) {
		blocks.push(logoot.insertBlock(i).blockId);
		const base = 3 * i;
		const content = '' + base + '' + (base + 1) + '' + (base + 2);
		logoot.insertContentInBlock(content, 0, blocks[i]);
	}

	instance.startState = logoot.getState();
}

// Comment out if you just want to use the default startstate
// createInitialCRDT(res);

fs.writeFile(
	`generateTestcases/testSuites/definitions/${testSuiteName}.json`,
	JSON.stringify(res, null, 4),
	function(err) {
		if (err) return console.error(err);
	}
);

async function updateMain(n) {
	const data = await fs.readFileSync('generateTestcases/testSuites/main.json', {
		encoding: 'utf8',
		flag: 'r'
	});
	const parsed = JSON.parse(data);
	parsed.push({
		file: `${n}.json`,
		execute: true
	});
	fs.writeFile(
		`generateTestcases/testSuites/main.json`,
		JSON.stringify(parsed, null, 4),
		function(err) {
			if (err) return console.error(err);
		}
	);
}

updateMain(testSuiteName);
