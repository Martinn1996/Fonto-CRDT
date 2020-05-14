const randomstring = require('randomstring');

/**
 * Returns a random string with parameter length.
 * @param {*} length of random string
 */
function generateCode(length) {
	return randomstring.generate({
		length: length,
		charset: 'alphabetic',
		capitalization: 'lowercase'
	});
}

module.exports = generateCode;
