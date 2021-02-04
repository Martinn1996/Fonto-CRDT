const generateDeleteBlockOperations = require('./generatePossibleOperations/generateDeleteBlockOperations');
const generateDeleteContentInBlockOperations = require('./generatePossibleOperations/generateDeleteContentInBlockOperations');
const generateInsertBlockOperations = require('./generatePossibleOperations/generateInsertBlockOperations');
const generateInsertContentInBlockOperations = require('./generatePossibleOperations/generateInsertContentInBlockOperations');
const generateMergeBlockOperations = require('./generatePossibleOperations/generateMergeBlockOperations');
const generateMoveBlockOperations = require('./generatePossibleOperations/generateMoveBlockOperations');
const generateSplitBlockOperations = require('./generatePossibleOperations/generateSplitBlockOperations');

module.exports = [
	generateInsertBlockOperations,
	generateDeleteBlockOperations,
	generateMoveBlockOperations,
	generateSplitBlockOperations,
	generateMergeBlockOperations,
	generateInsertContentInBlockOperations,
	generateDeleteContentInBlockOperations
];
