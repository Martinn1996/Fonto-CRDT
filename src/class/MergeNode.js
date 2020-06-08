const Node = require('./Node');

/**
 * Character nodes for characters in the tree
 */
class MergeNode extends Node {
	/**
	 * Constructor for creating character nodes
	 * @param {*} id for Logoot
	 * @param {*} referenceId to merged node
	 */
	constructor(id, referenceId) {
		super(id);

		super.type = 'Merge';
		this.referenceId = referenceId;
	}
}

module.exports = MergeNode;
