/**
 * Generates a random biased integer
 * @param {Integer} a
 * @param {Integer} b
 * @param {Integer} bias
 * @return {Integer} random biased integer
 */
function randomBiasedInt(a, b, bias) {
	return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1;
}

module.exports = randomBiasedInt;
