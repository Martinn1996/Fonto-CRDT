const randomstring = require('randomstring');

/**
 *
 * @param {*} length
 * @return {*} returns a randomized string of length
 */
function generateCode(length) {
	return randomstring.generate({
		length: length,
		charset: 'alphabetic',
		capitalization: 'lowercase'
	});
}

module.exports = generateCode;
