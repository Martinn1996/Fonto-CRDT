const Node = require('./Node');

/**
 * Character nodes for characters in the tree
 */
class CharacterNode extends Node {
	/**
	 * Constructor for creating character nodes
	 * @param {*} id for Logoot
	 * @param {*} value to save
	 */
	constructor(id, value) {
		super(id);

		super.type = 'Character';
		this.value = value || null;
	}
}

module.exports = CharacterNode;
