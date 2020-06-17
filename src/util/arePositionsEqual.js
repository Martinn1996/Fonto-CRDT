/**
 * Checks whether position a and b are equal
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {boolean} whether a and b are equal
 */
function arePositionsEqual(a, b) {
	if (a.length !== b.length) return false;

	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

module.exports = arePositionsEqual;
