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
		child.parent = this;
		const index = this._leftmostSearch(child);

		this.children.splice(index, 0, child);
		this.adjustSize(child.size);

		return child;
	}

	/**
	 * Removes the child from this node
	 * @param {Node} child to remove from this node
	 * @return {Node} returns the removed child
	 */
	removeChild(child) {
		const index = this._exactSearch(child);

		if (index === null) return;

		this.children.splice(index, 1);
		this.adjustSize(child.size);

		return child;
	}

	/**
	 * Setter for the empty attribute
	 * @param {boolean} bool whether the node is empty
	 */
	setEmpty(bool = true) {
		if (bool === this.empty) return;

		this.empty = bool;

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
		if (!this.parent) return;

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
		if (!this.parent) return [];

		return this.parent.getPath().concat([this.id]);
	}

	/**
	 * Returns the children by id
	 * @param {Integer} id of the child to find
	 * @return {Node} child with the corresponding id
	 */
	getChildById(id) {
		const index = this._exactSearch({ id });

		if (index === null) return null;

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

		path.every(id => {
			next = current.getChildById(id);

			if (!next && !build) {
				current = null;
				return false;
			}

			if (!next && build) {
				next = NodeType ? new NodeType(id) : new Node(id);

				current.addChild(next);
				next.setEmpty(true);
			}

			current = next;
			return true;
		});

		return current;
	}

	/**
	 * Returns the order of the node in the tree
	 * @return {Integer} the order
	 */
	getOrder() {
		if (!this.parent) return -1;

		let order = this.parent.getOrder();

		if (!this.parent.empty) order += 1;

		for (const child of this.parent.children) {
			if (Node.compare(child.id, this.id) === 0) break;
			order += child.size;
		}

		return order;
	}

	/**
	 * Find child with corresponding index
	 * @param {Integer} index of the child
	 * @return {Node}
	 */
	getChildByOrder(index) {
		if (index === 0 && !this.empty) return this;

		let left = this.empty ? 0 : 1;
		let right = left;

		for (const child of this.children) {
			right += child.size;
			if (left <= index && right > index) {
				return child.getChildByOrder(index - left);
			}
			left = right;
		}

		return null;
	}

	/**
	 * Apply callback function for whole tree starting from this node
	 * @param {function(_): _} fn callback function
	 */
	walk(fn) {
		fn(this);

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

	this.site = site;
	this.clock = 0;
	this._deleteQueue = [];
	this._bias = bias || 15;

	Node.compare = (a, b) => {
		return a.compare(b);
	};

	this._root = new Node();
	this._root.setEmpty(true);
	this._root.addChild(new Node(new Identifier(MIN, null, null)));
	this._root.addChild(new Node(new Identifier(BASE, null, null)));

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
		super(id);

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
		super(id);

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
	if (a.length !== b.length) return false;

	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

/**
 * Receive function for all the emits
 * @param {JSON} operation
 */
Logoot.prototype.receive = function(operation) {
	if (!operation.parsed) operation = parseOperation(operation);

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

	const existingNode = this._root.getChildByPath(operation.position, false, CharacterNode);

	if (existingNode) return;

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

	const existingNode = this._root.getChildByPath(operation.position, false, BlockNode);

	if (existingNode) return;

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
	const block = this._searchBlock(operation.blockId);
	const logoot = block.logoot;

	const deleteQueueIndex = logoot._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});

	if (deleteQueueIndex > -1) {
		logoot._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}

	const existingNode = logoot._root.getChildByPath(operation.position, false, CharacterNode);

	if (existingNode) return;

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
	const node = this._root.getChildByPath(operation.position, false, CharacterNode);

	if (node && !node.empty) {
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
		this._deleteQueue.push(operation);
	}
};

/**
 * Removes the same block node as the received removed block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveDeleteBlock = function(operation) {
	this._deleteBlock(operation.blockId);
};

/**
 * Removes the same character node as the received removed character node in a block node
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveDeleteInBlock = function(operation) {
	const block = this._searchBlock(operation.blockId);
	const node = block.logoot._root.getChildByPath(operation.position, false, CharacterNode);

	if (node && !node.empty) {
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
		this._deleteQueue.push(operation);
	}
};

/**
 * Copies the logoot to the new block (moved block)
 * @param {JSON} operation to perform
 */
Logoot.prototype._receiveMoveBlock = function(operation) {
	const oldBlock = this._searchBlock(operation.oldBlockId);
	const newBlock = this._searchBlock(operation.newBlockId);

	if (!oldBlock || !newBlock) {
		throw Error('One of the blocks is not defined');
	}

	newBlock.logoot = oldBlock.logoot;
};

/**
 * Reassigns the id of the block
 * @param {JSON} operation to perform
 */
Logoot.prototype._changeBlockId = function(operation) {
	const block = this._searchBlock(operation.oldId);

	if (!block) {
		throw Error(`Could not find block of blockId: ${operation.oldBlockId}`);
	}

	block.blockId = operation.newBlockId;
};

/**
 * Inserts the value into the tree on index
 * @param {string} value to insert
 * @param {Integer} index for insertion
 */
Logoot.prototype.insert = function(value, index) {
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
	index = Math.min(index, this.length());

	const prev = this._root.getChildByOrder(index);
	const next = this._root.getChildByOrder(index + 1);

	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	const position = this._generatePositionBetween(prevPos, nextPos);

	const node = this._root.getChildByPath(position, true, CharacterNode);
	node.value = value;
	node.setEmpty(false);

	this.emit('operation', {
		type: 'insert',
		position: position,
		value: value
	});

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
	const newPos = [];

	const maxLength = Math.max(prevPos.length, nextPos.length);
	let samePrefixes = true;

	for (let depth = 0; depth < maxLength + 1; depth++) {
		const DEPTH_MAX = doubledBase(depth);
		const prevId = prevPos[depth] || new Identifier(MIN, null, null);

		const nextId =
			samePrefixes && nextPos[depth] ? nextPos[depth] : new Identifier(DEPTH_MAX, null, null);

		const diff = nextId.int - prevId.int;

		if (diff > 1) {
			newPos.push(this._generateNewIdentifier(prevId.int, nextId.int));
			break;
		} else {
			// eslint-disable-next-line no-unused-expressions
			if (prevId.site === null && depth > 0) prevId.site === this.site;
			newPos.push(prevId);
			if (prevId.compare(nextId) !== 0) samePrefixes = false;
		}
	}

	return newPos;
};

/**
 * Deletes from index 'length' nodes
 * @param {Integer} index
 * @param {Integer} length
 */
Logoot.prototype.delete = function(index, length = 1) {
	for (let i = 0; i < length; i++) {
		this._delete(index);
	}
};

/**
 * Deletes the node on index
 * @param {Integer} index
 */
Logoot.prototype._delete = function(index) {
	const node = this._root.getChildByOrder(index + 1);

	if (!node || node.id.site === null) return;

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
	const arr = [];

	this._root.walk(node => {
		if (!node.empty) {
			if (node.logoot) {
				arr.push(`${node.logoot.value()}\n\n`);
			} else {
				arr.push(node.value);
			}
		}
	});

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
	const res = {
		id: node.id,
		size: node.size,
		empty: node.empty,
		type: node.type,
		value: node.value,
		children: node.children.map(getStateLogoot)
	};

	if (node.type === 'Block') {
		res['logoot'] = node.logoot ? getStateLogoot(node.logoot._root) : null;
		res['blockId'] = node.blockId;
	}

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
		if (n.type === 'Block') {
			node.blockId = n.blockId;
			node.logoot = new Logoot(node.blockId);

			node.logoot.setState(JSON.stringify({ root: n.logoot }));
		}
		return node;
	}

	this._root = parseNode(parsed.root, null);
	this._deleteQueue = parsed.deleteQueue;
};

/**
 * New insertion for characters
 * @param {Integer} index index of the block
 * @param {string} id optional id of the block
 * @return {string} blockId
 */
Logoot.prototype.insertBlock = function(index, id) {
	index = Math.min(index, this.length());

	const prev = this._root.getChildByOrder(index);
	const next = this._root.getChildByOrder(index + 1);

	const prevPos = prev.getPath();
	const nextPos = next.getPath();

	const position = this._generatePositionBetween(prevPos, nextPos);

	const node = this._root.getChildByPath(position, true, BlockNode);
	node.setEmpty(false);
	const blockId = id ? id : generateString(5);
	node.blockId = blockId;

	this.emit('operation', {
		type: 'insertBlock',
		position: position,
		blockId: blockId
	});

	return node;
};

/**
 * Inserts the value into the index of block with blockId
 * @param {string} content to write
 * @param {Integer} index of the block to write the value to
 * @param {string} blockId of the block to write to
 */
Logoot.prototype.insertContentInBlock = function(content, index, blockId) {
	let node = null;

	if (blockId !== undefined && blockId !== null && blockId !== '') {
		node = this._searchBlock(blockId);
	}

	if (node === null) {
		console.error(`Block not found! Insertion in block: ${blockId} cancelled.`);
		return;
	}

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

Logoot.prototype.replaceRangeInBlock = function(value, start, length, blockId) {
	this.deleteContentInBlock(start, length, blockId);
	this.insertContentInBlock(value, start, blockId);
};

/**
 * Breadth-first search for blocks on id
 * @param {string} blockId for searching block
 * @return {BlockNode} block node with corresponding id
 */
Logoot.prototype._searchBlock = function(blockId) {
	const queue = [];
	queue.push(this._root);

	while (queue.length > 0) {
		const node = queue.shift();

		if (node instanceof BlockNode && node.blockId === blockId && !node.empty) {
			return node;
		}

		for (const child of node.children) {
			queue.push(child);
		}
	}

	console.error(`Could not find block: ${blockId}`);
	return null;
};

/**
 * Moves the block to the index
 * @param {string} blockId to perfom on
 * @param {Integer} index of the position of the new block
 */
Logoot.prototype.moveBlock = function(blockId, index) {
	const block = this._searchBlock(blockId);

	if (!block) {
		throw Error(`Could not find block of id: ${blockId}`);
	}

	const newBlock = this.insertBlock(index);

	newBlock.logoot = block.logoot;

	this.emit('operation', {
		type: 'moveBlock',
		position: [],
		oldBlockId: blockId,
		newBlockId: newBlock.blockId
	});

	this.deleteBlock(blockId);

	this.emit('operation', {
		type: 'changeBlockId',
		position: [],
		oldId: newBlock.blockId,
		newBlockId: blockId
	});

	newBlock.blockId = blockId;
};

/**
 * Deletes the block in the tree
 * @param {string} blockId id for block
 */
Logoot.prototype._deleteBlock = function(blockId) {
	const block = this._searchBlock(blockId);

	if (!block) {
		console.error(`There does not exist a block of id ${blockId}`);
		return;
	}

	block.logoot = null;
	block.setEmpty(true);
	block.trimEmpty();
};

/**
 * Removes block from tree and communicates with other CRDTs
 * @param {string} blockId id for block
 */
Logoot.prototype.deleteBlock = function(blockId) {
	this._deleteBlock(blockId);

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
	const block1 = this._searchBlock(blockId1);
	const block2 = this._searchBlock(blockId2);

	if (!block1 || !block2) {
		throw Error('BlockId does not exist');
	}

	this.insertContentInBlock(block2.logoot.value(), block1.logoot.value().length, blockId1);

	this.deleteBlock(blockId2);
};

/**
 * Deletes content in block
 * @param {Integer} index of start of deletion
 * @param {Integer} length amount of items to delete
 * @param {string} blockId of location to delete the content
 */
Logoot.prototype.deleteContentInBlock = function(index, length = 1, blockId) {
	const block = this._searchBlock(blockId);

	for (let i = 0; i < length; i++) {
		const node = block.logoot._root.getChildByOrder(index + 1);

		if (!node || node.id.site === null) continue;

		node.setEmpty(true);
		node.trimEmpty();

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
 * @return {blockNode} newBlock
 */
Logoot.prototype.splitBlock = function(blockId, index) {
	const block = this._searchBlock(blockId);

	if (!block) {
		throw Error('BlockId does not exist');
	}

	if (index > block.logoot.value().length || index < 0) {
		throw Error('Index out of range');
	}

	const blockIndex = block.getOrder();
	const newBlock = this.insertBlock(blockIndex + 1);

	const content = block.logoot.value().substring(index, block.logoot.value().length);

	this.deleteContentInBlock(index, content.length, block.blockId);

	this.insertContentInBlock(content, 0, newBlock.blockId);
	return newBlock;
};

module.exports = Logoot;
