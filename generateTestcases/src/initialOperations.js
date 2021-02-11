const generateInsertOperations = require('./generatePossibleOperations/generateInsertOperations');
const generateDeleteOperations = require('./generatePossibleOperations/generateDeleteOperations');

module.exports = [generateInsertOperations, generateDeleteOperations];
