const operations = require('./operations');

module.exports = operationNames => {
	const res = [];
	for (const name of operationNames) {
		const operation = operations[name];
		if (!operation) {
			throw new Error('operation ' + name + ' is not defined');
		}
		res.push(operation);
	}
	return res;
};
