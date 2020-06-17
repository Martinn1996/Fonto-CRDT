const parseId = require('./parseId');

/**
 * Parses the operation for this tree model
 * @param {JSON} operation to parse
 * @return {JSON}
 */
function parseOperation(operation) {
	operation.parsed = true;
	operation.position = operation.position.map(parseId);
	return operation;
}

module.exports = parseOperation;
