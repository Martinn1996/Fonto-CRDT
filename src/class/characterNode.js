const Node = require('./node');

class CharacterNode extends Node {
	/**
	 * Constructor for creating character nodes
	 * @param {*} id for Logoot
	 * @param {*} value to save
	 */
	constructor(id, value) {
		super(id);
		this.value = value || null;
		super.type = 'Character';
	}
}

// Export class
module.exports = CharacterNode;
