const Node = require('./node');

/**
 * Node for characters
 * @param {*} id for Logoot
 * @param {*} value to save
 */
function CharacterNode(id, value) {
	// Call constructor of parent class
	Node.call(this, id);

	this.value = value || null;
}

// Extend Node class
CharacterNode.prototype = Object.create(Node.prototype);

// Overwrite method
CharacterNode.prototype.getChildByPath = function(path, build) {
	let current = this;
	let next = null;
	path.every(id => {
		next = current.getChildById(id);
		if (!next && !build) {
			current = null;
			return false;
		}
		if (!next && build) {
			next = new CharacterNode(id);
			current.addChild(next);
			next.setEmpty(true);
		}
		current = next;
		return true;
	});
	return current;
};

// Export class
module.exports = CharacterNode;
