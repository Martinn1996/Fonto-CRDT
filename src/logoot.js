const EventEmitter = require('nanobus');
const inherits = require('inherits');

const Identifier = require('./identifier');

const generateString = require('./util/generateCode');

// eslint-disable-next-line no-use-before-define
inherits(Logoot, EventEmitter);

const MIN = 0;
const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

/**
 * Node class for the tree
 */
class Node {
	// Constructor for creating a Node
	constructor(id) {
		this.id = id;
		this.children = [];
		this.parent = null;
		this.size = 1;
		this.empty = false;
		this.type = 'Node';
	}

	/**
	 * Searches for the child
	 * @param {Node} child node to find
	 * @return {Integer} index of the node
	 */
	_leftmostSearch(child) {
		let L = 0;
		let R = this.children.length;
		let M;
		while (L < R) {
			M = Math.floor((L + R) / 2);
			if (Node.compare(this.children[M].id, child.id) < 0) {
				L = M + 1;
			} else {
				R = M;
			}
		}
		return L;
	}

	/**
	 * Finds the child node
	 * @param {Node} child to find
	 * @return {Integer} the index of the child
	 */
	_exactSearch(child) {
		let L = 0;
		let R = this.children.length - 1;
		let M;
		while (L <= R) {
			M = Math.floor((L + R) / 2);
			const comp = Node.compare(this.children[M].id, child.id);
			if (comp < 0) {
				L = M + 1;
			} else if (comp > 0) {
				R = M - 1;
			} else {
				return M;
			}
		}
		return null;
	}

	/**
	 * Adjusts the size of the parent
	 * @param {Integer} amount to increment the size with
	 */
	adjustSize(amount) {
		this.size += amount;
		if (this.parent) this.parent.adjustSize(amount);
	}

	/**
	 * Adds the child to this node
	 * @param {Node} child to add to this node
	 * @return {Node} returns the child
	 */
	addChild(child) {
		// Sets paretn to this node
		child.parent = this;
		const index = this._leftmostSearch(child);

		// Adds the children at index
		this.children.splice(index, 0, child);
		this.adjustSize(child.size);

		// Returns the added child
		return child;
	}

	/**
	 * Removes the child from this node
	 * @param {Node} child to remove from this node
	 * @return {Node} returns the removed child
	 */
	removeChild(child) {
		// Find index of the child
		const index = this._exactSearch(child);

		// Nothing to remove
		if (index === null) return;

		// Removes child from this node
		this.children.splice(index, 1);
		this.adjustSize(child.size);

		// Returns the removed child
		return child;
	}

	/**
	 * Setter for the empty attribute
	 * @param {boolean} bool whether the node is empty
	 */
	setEmpty(bool = true) {
		// No adjustments
		if (bool === this.empty) return;

		// Adjust empty attribute
		this.empty = bool;

		// Adjust size
		if (bool) {
			this.adjustSize(-1);
		} else {
			this.adjustSize(1);
		}
	}

	/**
	 * Removes the node from the tree when it has no children
	 */
	trimEmpty() {
		// Already disconnected
		if (!this.parent) return;

		// Remove node when no children and empty
		if (this.empty && this.children.length === 0) {
			this.parent.removeChild(this);
			this.parent.trimEmpty();
		}
	}

	/**
	 * Retrieves the path to this node
	 * @return {[Integer]} path to get to this node
	 */
	getPath() {
		// No parent; disconnected from the tree.
		if (!this.parent) return [];

		// Return path with recursive call
		return this.parent.getPath().concat([this.id]);
	}

	/**
	 * Returns the children by id
	 * @param {Integer} id of the child to find
	 * @return {Node} child with the corresponding id
	 */
	getChildById(id) {
		// Find index
		const index = this._exactSearch({ id });

		// No nodes found with corresponding id
		if (index === null) return null;

		// Return children with corresponding id
		return this.children[index];
	}

	/**
	 * Find child node and potentially build it
	 * @param {[Integer]} path to find the child
	 * @param {boolean} build whether to build or just search
	 * @param {Node} NodeType node type to build
	 * @return {Node} of the child
	 */
	getChildByPath(path, build, NodeType) {
		let current = this;
		let next = null;

		// Traverse along path
		path.every(id => {
			// Get first child of path
			next = current.getChildById(id);

			// No child found and no build
			if (!next && !build) {
				current = null;
				return false;
			}

			// No child found and build the child
			if (!next && build) {
				// Creates node from NodeType
				next = NodeType ? new NodeType(id) : new Node(id);

				// Sets new child
				current.addChild(next);
				next.setEmpty(true);
			}

			// Prepare for next iteration
			current = next;
			return true;
		});

		// Return the node
		return current;
	}

	/**
	 * Returns the order of the node in the tree
	 * @return {Integer} the order
	 */
	getOrder() {
		// -1 to discount the left end node
		if (!this.parent) return -1;

		// Find order of parent
		let order = this.parent.getOrder();

		// Adjust order for this node when attached to existing parent
		if (!this.parent.empty) order += 1;

		// Iterate through all the children and adjust order accordingly
		for (const child of this.parent.children) {
			if (Node.compare(child.id, this.id) === 0) break;
			order += child.size;
		}

		// Return order
		return order;
	}

	/**
	 * Find child with corresponding index
	 * @param {Integer} index of the child
	 * @return {Node}
	 */
	getChildByOrder(index) {
		// Get this
		if (index === 0 && !this.empty) return this;

		// Prepare for iteration
		let left = this.empty ? 0 : 1;
		let right = left;

		// Iterate through children
		for (const child of this.children) {
			right += child.size;
			if (left <= index && right > index) {
				return child.getChildByOrder(index - left);
			}
			left = right;
		}

		// No child found
		return null;
	}

	/**
	 * Apply callback function for whole tree starting from this node
	 * @param {function(_): _} fn callback function
	 */
	walk(fn) {
		// Perform callback function on this node
		fn(this);

		// Perform recursive call for all children
		this.children.forEach(child => {
			child.walk(fn);
		});
	}
}

/**
 * Logoot instance
 * @param {string} site of crdt
 * @param {JSON} state of the tree
 * @param {Integer} bias
 */
function Logoot(site, state, bias) {
	EventEmitter.call(this);

	// Set attributes
	this.site = site;
	this.clock = 0;
	this._deleteQueue = [];
	this._bias = bias || 15;

	Node.compare = (a, b) => {
		return a.compare(b);
	};

	// Setup root and start children
	this._root = new Node();
	this._root.setEmpty(true);
	this._root.addChild(new Node(new Identifier(MIN, null, null)));
	this._root.addChild(new Node(new Identifier(BASE, null, null)));

	// Set state when provided
	if (state) this.setState(state);
}

/**
 * Block node for blocks in the tree
 */
class BlockNode extends Node {
	/**
	 * Constructor for creating block nodes
	 * @param {*} id for Logoot
	 * @param {*} blockId for refering to blocks
	 */
	constructor(id, blockId) {
		// Call constructor of parent class
		super(id);

		// Set attributes
		super.type = 'Block';
		this.blockId = blockId;
		this.empty = false;
		this.logoot = new Logoot(blockId);
	}
}

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
		// Call constructor of parent class
		super(id);

		// Set attributes
		super.type = 'Character';
		this.value = value || null;
	}
}

/**
 * Returns the parsed node type
 * @param {string} nodeType to parse
 * @return {Node} parsed node type
 */
function createNodeFromType(nodeType) {
	switch (nodeType) {
		case 'Character':
			return CharacterNode;
		case 'Block':
			return BlockNode;
		default:
			return Node;
	}
}

/**
 * Parses the id into an identifier
 * @param {Identifier} id to insert
 * @return {Identifier}
 */
function parseId(id) {
	if (id) return new Identifier(id.int, id.site, id.clock);
}

/**
 * Parses the operation for this tree model
 * @param {JSON} operation to parse
 * @return {JSON}
 */
function parseOperation(operation) {
	operation.parsed = true;
	operation.position = operation.position.map(parseId);
	return operation;
}

/**
 * Checks whether position a and b are equal
 * @param {[Integer]} a
 * @param {[Integer]} b
 * @return {boolean} whether a and b are equal
 */
function arePositionsEqual(a, b) {
	// Incorrect length
	if (a.length !== b.length) return false;

	// Compare all items
	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

/**
 * Receive function for all the emits
 * @param {JSON} operation
 */
Logoot.prototype.receive = function(operation) {
	// Parse operation if not done yet
	if (!operation.parsed) operation = parseOperation(operation);

	// Redirects to the corrseponding method for the type
	switch (operation.type) {
		case 'insert':
			this._receiveInsert(operation);
			break;
		case 'insertBlock':
			this._receiveInsertBlock(operation);
			break;
		case 'insertInBlock':
			this._receiveInsertInBlock(operation);
			break;
		case 'delete':
			this._receiveDelete(operation);
			break;
		case 'deleteBlock':
			this._receiveDeleteBlock(operation);
			break;
		case 'deleteInBlock':
			this._receiveDeleteInBlock(operation);
			break;
		case 'moveBlock':
			this._receiveMoveBlock(operation);
			break;
		case 'changeBlockId':
			this._changeBlockId(operation);
			break;
	}
};

/**
 * Builds the same node as the received inserted node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveInsert = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});

	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}

	// Checks whether the node already exists
	const existingNode = this._root.getChildByPath(operation.position, false, CharacterNode);

	// Invalid duplication, ignore it
	if (existingNode) return;

	// Create new character node at the same position
	const node = this._root.getChildByPath(operation.position, true, CharacterNode);
	node.value = operation.value;
	node.setEmpty(false);
	const index = node.getOrder();

	this.emit('insert', {
		value: node.value,
		index: index
	});
};

/**
 * Builds the same block node as the received inserted block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveInsertBlock = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});

	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}

	// Checks whether the node already exists
	const existingNode = this._root.getChildByPath(operation.position, false, BlockNode);

	// Invalid duplication, ignore it
	if (existingNode) return;

	// Create new block node at the same position
	const node = this._root.getChildByPath(operation.position, true, BlockNode);
	const blockId = operation.blockId;
	node.blockId = blockId;
	node.setEmpty(false);
	const index = node.getOrder();

	this.emit('insertBlock', {
		blockId: blockId,
		index: index
	});
};

/**
 * Builds the same block node as the received inserted block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveInsertInBlock = function(operation) {
	// Retrieves the block the operation needs to be performed on
	const block = this._searchBlock(operation.blockId);
	const logoot = block.logoot;

	const deleteQueueIndex = logoot._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});

	if (deleteQueueIndex > -1) {
		logoot._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}

	// Checks whether the node already exists
	const existingNode = logoot._root.getChildByPath(operation.position, false, CharacterNode);

	// Invalid duplication, ignore it
	if (existingNode) return;

	// Create new character node at the same position
	const node = logoot._root.getChildByPath(operation.position, true, CharacterNode);
	node.value = operation.value;
	node.setEmpty(false);
	const index = node.getOrder();

	this.emit('insertInBlock', {
		value: node.value,
		index: index,
		blockId: block.blockId
	});
};

/**
 * Removes the same node as the received removed node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveDelete = function(operation) {
	// Retrieves the node to delete
	const node = this._root.getChildByPath(operation.position, false, CharacterNode);

	// Checks whether the node is found and removable
	if (node && !node.empty) {
		// Removes the node
		const index = node.getOrder();
		const value = node.value;
		node.setEmpty(true);
		node.trimEmpty();

		this.emit('delete', {
			value: value,
			index: index
		});
	} else if (
		!this._deleteQueue.some(op => {
			return arePositionsEqual(op.position, operation.position);
		})
	) {
		// Enqueue
		this._deleteQueue.push(operation);
	}
};

/**
 * Removes the same block node as the received removed block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveDeleteBlock = function(operation) {
	// Calls the remove block function
	this._deleteBlock(operation.blockId);
};

/**
 * Removes the same character node as the received removed character node in a block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveDeleteInBlock = function(operation) {
	// Retrieves the block node
	const block = this._searchBlock(operation.blockId);
	const node = block.logoot._root.getChildByPath(operation.position, false, CharacterNode);

	// Checks whether the node is found and removable
	if (node && !node.empty) {
		// Removes the node
		const index = node.getOrder();
		const value = node.value;
		node.setEmpty(true);
		node.trimEmpty();

		this.emit('deleteInBlock', {
			value: value,
			index: index,
			blockId: operation.blockId
		});
	} else if (
		!this._deleteQueue.some(op => {
			return arePositionsEqual(op.position, operation.position);
		})
	) {
		// Enqueue
		this._deleteQueue.push(operation);
	}
};

/**
 * Copies the logoot to the new block (moved block)
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveMoveBlock = function(operation) {
	// Retrieves the blocks
	const oldBlock = this._searchBlock(operation.oldBlockId);
	const newBlock = this._searchBlock(operation.newBlockId);

	// Throw error when one of them are empty
	if (!oldBlock || !newBlock) {
		throw Error('One of the blocks is not defined');
	}

	// Copy the logoot
	newBlock.logoot = oldBlock.logoot;
};

/**
 * Reassigns the id of the block
 * @param {JSON} operation to perform
 */
Logoot.prototype._changeBlockId = function(operation) {
	// Retrieves the block
	const block = this._searchBlock(operation.oldId);

	// Throw error when no block is found
	if (!block) {
		throw Error(`Could not find block of blockId: ${operation.oldBlockId}`);
	}

	// Give block a new Id
	block.blockId = operation.newBlockId;
};

/**
 * Inserts the value into the tree on index
 * @param {string} value to insert
 * @param {Integer} index for insertion
 */
Logoot.prototype.insert = function(value, index) {
	// Perform the insert for each character individually
	value.split('').forEach((character, i) => {
		this._insert(character, index + i);
	});
};

/**
 * Inserts the character into the tree on index
 * @param {string} value to insert
 * @param {Integer} index for insertion
 * @return {[Integer]} path to the newly created node
 */
Logoot.prototype._insert = function(value, index) {
	// Filters the index
	index = Math.min(index, this.length());

	// Retrieve the neighbor nodes
	const prev = this._root.getChildByOrder(index);
	const next = this._root.getChildByOrder(index + 1);

	// Retrieves the path of the neighbor nodes
	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	// Create new position
	const position = this._generatePositionBetween(prevPos, nextPos);

	// Create the node with the newly created position
	const node = this._root.getChildByPath(position, true, CharacterNode);
	node.value = value;
	node.setEmpty(false);

	this.emit('operation', {
		type: 'insert',
		position: position,
		value: value
	});

	// Return the path to the new node
	return node.getPath();
};

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

/**
 * Generates random alternation
 * @param {Integer} bias
 * @return {Integer} random alternation
 */
function randomAlternation(bias) {
	return Math.random() > 0.5 ? bias : 1 / bias;
}

/**
 * Returns the doubled base
 * @param {Integer} depth
 * @return {Integer} doubled base
 */
function doubledBase(depth) {
	return Math.min(BASE * Math.pow(2, depth), MAX);
}

/**
 * Generates a new identifier based on previous and next ids
 * @param {Integer} prevInt id of left neighbor
 * @param {Integer} nextInt id of right neighbor
 * @return {Identifier} generated identifier
 */
Logoot.prototype._generateNewIdentifier = function(prevInt, nextInt) {
	const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias));
	return new Identifier(int, this.site, this.clock++);
};

/**
 * Generates the position between the prevPos and nextPos
 * @param {[Integer]} prevPos position of left neighbor
 * @param {[Integer]} nextPos position of right neighbor
 * @return {[Integer]} generated position
 */
Logoot.prototype._generatePositionBetween = function(prevPos, nextPos) {
	// Initialise position
	const newPos = [];

	// Gets max length to check
	const maxLength = Math.max(prevPos.length, nextPos.length);
	let samePrefixes = true;

	// Loop until depth is reached
	for (let depth = 0; depth < maxLength + 1; depth++) {
		const DEPTH_MAX = doubledBase(depth);
		const prevId = prevPos[depth] || new Identifier(MIN, null, null);

		// base doubling
		const nextId =
			samePrefixes && nextPos[depth] ? nextPos[depth] : new Identifier(DEPTH_MAX, null, null);

		const diff = nextId.int - prevId.int;

		if (diff > 1) {
			// Enough room for integer between prevInt and nextInt
			newPos.push(this._generateNewIdentifier(prevId.int, nextId.int));
			break;
		} else {
			// Insufficient room between prevInt and nextInt
			// eslint-disable-next-line no-unused-expressions
			if (prevId.site === null && depth > 0) prevId.site === this.site;
			newPos.push(prevId);
			if (prevId.compare(nextId) !== 0) samePrefixes = false;
		}
	}

	// Returns new position in between
	return newPos;
};

/**
 * Deletes from index 'length' nodes
 * @param {Integer} index
 * @param {Integer} length
 */
Logoot.prototype.delete = function(index, length = 1) {
	// Calls the delete function for every character that needs to be deleted
	for (let i = 0; i < length; i++) {
		this._delete(index);
	}
};

/**
 * Deletes the node on index
 * @param {Integer} index
 */
Logoot.prototype._delete = function(index) {
	// Gets the node to delete
	const node = this._root.getChildByOrder(index + 1);

	// No node is found
	if (!node || node.id.site === null) return;

	// Delete node
	node.setEmpty(true);
	node.trimEmpty();

	this.emit('operation', {
		type: 'delete',
		position: node.getPath()
	});
};

/**
 * Construct a string from the sequence
 * @return {string} value of the tree
 */
Logoot.prototype.value = function() {
	// Construct new array
	const arr = [];

	// Append the value of all the nodes starting from the root
	this._root.walk(node => {
		if (!node.empty) {
			if (node.logoot) {
				arr.push(`${node.logoot.value()}\n\n`);
			} else {
				arr.push(node.value);
			}
		}
	});

	// Convert to string
	return arr.join('');
};

/**
 * Returns the size of the root excluding the start and end node
 * @return {Integer} size of the root
 */
Logoot.prototype.length = function() {
	return this._root.size - 2;
};

/**
 * Replace text in range with value
 * @param {string} value to write
 * @param {Integer} start index to delete
 * @param {Integer} length of deletion
 */
Logoot.prototype.replaceRange = function(value, start, length) {
	this.delete(start, length);
	this.insert(value, start);
};

/**
 * Sets the value of the tree
 * @param {string} value to write
 */
Logoot.prototype.setValue = function(value) {
	this.replaceRange(value, 0, this.length());
};

/**
 * Returns a parsed logoot representation
 * @param {*} node to parse
 * @return {JSON} state of the logoot
 */
function getStateLogoot(node) {
	// Sets basic attributes
	const res = {
		id: node.id,
		size: node.size,
		empty: node.empty,
		type: node.type,
		value: node.value,
		children: node.children.map(getStateLogoot)
	};

	// When the type is a block
	if (node.type === 'Block') {
		res['logoot'] = node.logoot ? getStateLogoot(node.logoot._root) : null;
		res['blockId'] = node.blockId;
	}

	// Return representation
	return res;
}

/**
 * Returns the state of the JSON
 * @return {string} stringified JSON representation
 */
Logoot.prototype.getState = function() {
	return JSON.stringify(
		{
			root: getStateLogoot(this._root),
			deleteQueue: this._deleteQueue
		},
		(key, value) => (key === 'parent' ? undefined : value)
	);
};

/**
 * Parse the state into the tree
 * @param {string} state
 */
Logoot.prototype.setState = function(state) {
	// Parse to JSON
	const parsed = JSON.parse(state);

	/**
	 * Function to parse the JSON into the tree
	 * @param {Node} n 
	 * @param {Node} parent 
	 * @return {Node}
	 */
	function parseNode(n, parent) {
		const NodeType = createNodeFromType(n.type);
		const node = new NodeType(parseId(n.id), n.value);
		node.parent = parent;
		node.children = n.children.map(c => parseNode(c, node));
		node.size = n.size;
		node.empty = n.empty;
		return node;
	}

	// Parse the JSON
	this._root = parseNode(parsed.root, null);
	this._deleteQueue = parsed.deleteQueue;
};

// ***********************************
// | ADDITIONAL FUNCTIONS FOR BLOCKS |
// ***********************************

/**
 * New insertion for characters
 * @param {Integer} index index of the block
 * @param {string} id optional id of the block
 * @return {string} blockId
 */
Logoot.prototype.insertBlock = function(index, id) {
	// Get block to insert after and before
	index = Math.min(index, this.length());

	// Get neighbors
	const prev = this._root.getChildByOrder(index);
	const next = this._root.getChildByOrder(index + 1);

	// Gets the position of neighbors
	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	// Generates the position
	const position = this._generatePositionBetween(prevPos, nextPos);

	// Create node
	const node = this._root.getChildByPath(position, true, BlockNode);
	node.setEmpty(false);
	const blockId = id ? id : generateString(5);
	node.blockId = blockId;

	// Create emit operation
	this.emit('operation', {
		type: 'insertBlock',
		position: position,
		blockId: blockId
	});

	// Return newly created node
	return node;
};

/**
 * Inserts the value into the index of block with blockId
 * @param {string} content to write
 * @param {Integer} index of the block to write the value to
 * @param {string} blockId of the block to write to
 */
Logoot.prototype.insertContentInBlock = function(content, index, blockId) {
	// Initialise node for insertion
	let node = null;

	// Checks whether the insertion is for a specific block
	if (blockId !== undefined && blockId !== null && blockId !== '') {
		node = this._searchBlock(blockId);
	}

	// Cancel insertion when block is undefined or unfindable
	if (node === null) {
		console.error(`Block not found! Insertion in block: ${blockId} cancelled.`);
		return;
	}

	// Insert each character individually
	content.split('').forEach((value, i) => {
		const position = node.logoot._insert(value, index + i);
		this.emit('operation', {
			type: 'insertInBlock',
			position: position,
			value: value,
			blockId: blockId
		});
	});
};

/**
 * Breadth-first search for blocks on id
 * @param {string} blockId for searching block
 * @return {BlockNode} block node with corresponding id
 */
Logoot.prototype._searchBlock = function(blockId) {
	// Initialise queue
	const queue = [];
	queue.push(this._root);

	// Loop until all nodes are visited
	while (queue.length > 0) {
		// Get first node in the queue
		const node = queue.shift();

		// Found the node
		if (node instanceof BlockNode && node.blockId === blockId) {
			return node;
		}

		// Append children into the queue
		for (const child of node.children) {
			queue.push(child);
		}
	}

	// Invalid
	console.error(`Could not find block: ${blockId}`);
	return null;
};

/**
 * Moves the block to the index
 * @param {string} blockId to perfom on
 * @param {Integer} index of the position of the new block
 */
Logoot.prototype.moveBlock = function(blockId, index) {
	// Retrieves the block to move
	const block = this._searchBlock(blockId);

	// Throw error when no block is found
	if (!block) {
		throw Error(`Could not find block of id: ${blockId}`);
	}

	// Create new block at the new position
	const newBlock = this.insertBlock(index);

	// Copy the content
	newBlock.logoot = block.logoot;

	// Emit the move block operation
	this.emit('operation', {
		type: 'moveBlock',
		position: [],
		oldBlockId: blockId,
		newBlockId: newBlock.blockId
	});

	// Delete the old block
	this.deleteBlock(blockId);

	// Change new blockId to old blockId
	this.emit('operation', {
		type: 'changeBlockId',
		position: [],
		oldId: newBlock.blockId,
		newBlockId: blockId
	});

	// Update blockId
	newBlock.blockId = blockId;
};

/**
 * Deletes the block in the tree
 * @param {string} blockId id for block
 */
Logoot.prototype._deleteBlock = function(blockId) {
	// Find block
	const block = this._searchBlock(blockId);

	// No block is found
	if (!block) {
		console.error(`There does not exist a block of id ${blockId}`);
		return;
	}

	// Remove block node
	block.logoot = null;
	block.setEmpty(true);
	block.trimEmpty();
};

/**
 * Removes block from tree and communicates with other CRDTs
 * @param {string} blockId id for block
 */
Logoot.prototype.deleteBlock = function(blockId) {
	// Remove block from tree
	this._deleteBlock(blockId);

	// Emit message to other CRDTs
	this.emit('operation', {
		type: 'deleteBlock',
		position: [new Identifier(0, this.site, this.clock++)],
		blockId: blockId
	});
};

/**
 * Merge two blocks into one and delete the second block
 * @param {string} blockId1 The first block where all content will be merged into
 * @param {string} blockId2 The second block which will be deleted after the merge
 */
Logoot.prototype.mergeBlocks = function(blockId1, blockId2) {
	// Retrieves the blocks
	const block1 = this._searchBlock(blockId1);
	const block2 = this._searchBlock(blockId2);

	// Throw error when a block is not found
	if (!block1 || !block2) {
		throw Error('BlockId does not exist');
	}

	// Insert the content in one block
	this.insertContentInBlock(block2.logoot.value(), block1.logoot.value().length, blockId1);

	// Delete the unused block
	this.deleteBlock(blockId2);
};

/**
 * Deletes content in block
 * @param {Integer} index of start of deletion
 * @param {Integer} length amount of items to delete
 * @param {string} blockId of location to delete the content
 */
Logoot.prototype.deleteContentInBlock = function(index, length = 1, blockId) {
	// Find block
	const block = this._searchBlock(blockId);

	// Deletes character 'length' times
	for (let i = 0; i < length; i++) {
		// Finds the character
		const node = block.logoot._root.getChildByOrder(index + 1);

		// No node is found
		if (!node || node.id.site === null) continue;

		// Removes the node
		node.setEmpty(true);
		node.trimEmpty();

		// Emits the operation
		this.emit('operation', {
			type: 'deleteInBlock',
			position: node.getPath(),
			blockId: blockId
		});
	}
};

/**
 * Split block into two and moves the content over
 * @param {string} blockId
 * @param {Integer} index
 */
Logoot.prototype.splitBlock = function(blockId, index) {
	// Search for the block to split
	const block = this._searchBlock(blockId);

	// Create new block
	const blockIndex = block.getOrder();
	const newBlock = this.insertBlock(blockIndex);

	// Content to move
	const content = block.logoot.value().substring(index, block.logoot.value().length);

	// Delete from old block
	this.deleteContentInBlock(index, content.length, block.blockId);

	// Insert into new block
	this.insertContentInBlock(content, 0, newBlock.blockId);
};

module.exports = Logoot;
