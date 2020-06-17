const Identifier = require('../identifier');

/**
 * Parses the id into an identifier
 * @param {Identifier} id to insert
 * @return {Identifier}
 */
function parseId(id) {
	if (id) return new Identifier(id.int, id.site, id.clock);
}

module.exports = parseId;
