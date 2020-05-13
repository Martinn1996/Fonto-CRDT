const Node = require('./node');

/**
 * Node for characters
 * @param {*} id for Logoot
 * @param {*} value to save
 */
class CharacterNode extends Node {
	constructor(id, value) {
		super(id);
		this.value = value || null;
	}
}

// Export class
module.exports = CharacterNode;
