const Node = require('./Node');

/**
 * Special node to recognize a split in a block
 */
class SplitNode extends Node {
	/**
	 * Constructor for creating split nodes
	 * @param {*} id for Logoot
	 */
	constructor(id) {
		super(id);
		super.type = 'Split';
		super.empty = true;
	}
}

module.exports = SplitNode;
