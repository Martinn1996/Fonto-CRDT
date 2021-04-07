const generateDeleteBlockOperations = require('./generatePossibleOperations/generateDeleteBlockOperations');
const generateDeleteContentInBlockOperations = require('./generatePossibleOperations/generateDeleteContentInBlockOperations');
const generateInsertBlockOperations = require('./generatePossibleOperations/generateInsertBlockOperations');
const generateInsertContentInBlockOperations = require('./generatePossibleOperations/generateInsertContentInBlockOperations');
const generateMergeBlockOperations = require('./generatePossibleOperations/generateMergeBlockOperations');
const generateMoveBlockOperations = require('./generatePossibleOperations/generateMoveBlockOperations');
const generateSplitBlockOperations = require('./generatePossibleOperations/generateSplitBlockOperations');
const generateInsertOperations = require('./generatePossibleOperations/generateInsertOperations');
const generateDeleteOperations = require('./generatePossibleOperations/generateDeleteOperations');

module.exports = {
	generateInsertContentInBlockOperations,
	generateDeleteContentInBlockOperations,
	generateInsertBlockOperations,
	generateDeleteBlockOperations,
	generateMoveBlockOperations,
	generateSplitBlockOperations,
	generateMergeBlockOperations,
	generateInsertOperations,
	generateDeleteOperations
};
