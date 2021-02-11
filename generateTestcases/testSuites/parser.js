const fs = require('fs');
const parseOperations = require('../src/parseOperations');

function parseSuiteFromJSON(file) {
	let data = fs.readFileSync(`generateTestcases/testSuites/definitions/${file}`, {
		encoding: 'utf8',
		flag: 'r'
	});
	data = JSON.parse(data);
	data.operations = parseOperations(data.operations);
	return data;
}

module.exports = () => {
	const res = [];
	const data = fs.readFileSync('generateTestcases/testSuites/main.json', {
		encoding: 'utf8',
		flag: 'r'
	});
	const defintions = JSON.parse(data);

	for (const file of defintions) {
		res.push(parseSuiteFromJSON(file));
	}
	return res;
};
