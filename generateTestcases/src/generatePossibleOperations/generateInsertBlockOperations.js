const generateCode = require('../../../src/util/generateCode');
const generateIndices = require('../generateIndices');

module.exports = rootCRDT => {
	return generateIndices(rootCRDT).map(index => {
		return {
			type: 'insertBlock',
			index: index,
			blockId: generateCode(5)
		};
	});
};
