const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

/**
 * Returns the doubled base
 * @param {Integer} depth
 * @return {Integer} doubled base
 */
function doubledBase(depth) {
	return Math.min(BASE * Math.pow(2, depth), MAX);
}

module.exports = doubledBase;
