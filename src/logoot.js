const EventEmitter = require('nanobus');
const inherits = require('inherits');

const Identifier = require('./identifier');

const generateString = require('./util/generateCode');

// eslint-disable-next-line no-use-before-define
inherits(Logoot, EventEmitter);

const MIN = 0;
const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

class Node {
	constructor(id) {
		this.id = id;
		this.children = [];
		this.parent = null;
		this.size = 1;
		this.empty = false;
		this.type = 'Node';
	}

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

	adjustSize(amount) {
		this.size += amount;
		if (this.parent) this.parent.adjustSize(amount);
	}

	addChild(child) {
		child.parent = this;
		const index = this._leftmostSearch(child);
		this.children.splice(index, 0, child);
		this.adjustSize(child.size);
		return child;
	}

	removeChild(child) {
		const index = this._exactSearch(child);
		if (index === null) return;
		this.children.splice(index, 1);
		this.adjustSize(child.size);
		return child;
	}

	setEmpty(bool = true) {
		if (bool === this.empty) return;
		this.empty = bool;
		if (bool) {
			this.adjustSize(-1);
		} else {
			this.adjustSize(1);
		}
	}

	trimEmpty() {
		if (!this.parent) return;
		if (this.empty && this.children.length === 0) {
			this.parent.removeChild(this);
			this.parent.trimEmpty();
		}
	}

	getPath() {
		if (!this.parent) return [];
		return this.parent.getPath().concat([this.id]);
	}

	getChildById(id) {
		const index = this._exactSearch({ id });
		if (index === null) return null;
		return this.children[index];
	}

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

	getOrder() {
		// -1 to discount the left end node
		if (!this.parent) return -1;
		let order = this.parent.getOrder();
		if (!this.parent.empty) order += 1;
		for (let i = 0; i < this.parent.children.length; i++) {
			if (Node.compare(this.parent.children[i].id, this.id) === 0) break;
			order += this.parent.children[i].size;
		}
		return order;
	}

	getChildByOrder(index) {
		if (index === 0 && !this.empty) return this;
		let left = this.empty ? 0 : 1;
		let right = left;
		for (let i = 0; i < this.children.length; i++) {
			right += this.children[i].size;
			if (left <= index && right > index) {
				return this.children[i].getChildByOrder(index - left);
			}
			left = right;
		}
		return null;
	}

	walk(fn) {
		fn(this);
		this.children.forEach(child => {
			child.walk(fn);
		});
	}
}

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

class BlockNode extends Node {
	/**
	 * Constructor for creating block nodes
	 * @param {*} id for Logoot
	 * @param {*} blockId for refering to blocks
	 */
	constructor(id, blockId) {
		// Call constructor of parent class
		super(id);
		super.type = 'Block';

		this.blockId = blockId;
		this.empty = false;
		this.logoot = new Logoot(blockId);
	}
}

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

function parseId(id) {
	if (id) return new Identifier(id.int, id.site, id.clock);
}
function parseOperation(operation) {
	operation.parsed = true;
	operation.position = operation.position.map(parseId);
	return operation;
}
function arePositionsEqual(a, b) {
	if (a.length !== b.length) return false;
	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

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
		case 'moveBlock':
			this.receiveMoveBlock(operation);
			break;
		case 'changeBlockId':
			this.changeBlockId(operation);
			break;
	}
};

Logoot.prototype.receiveMoveBlock = function(operation) {
	const oldBlock = this._searchBlock(operation.oldBlockId);
	const newBlock = this._searchBlock(operation.newBlockId);
	if (!oldBlock || !newBlock) {
		throw Error('One of the blocks is not defined');
	}
	newBlock.logoot = oldBlock.logoot;
};

Logoot.prototype.changeBlockId = function(operation) {
	const block = this._searchBlock(operation.oldId);
	if (!block) {
		throw Error(`Could not find block of blockId: ${operation.oldBlockId}`);
	}
	block.blockId = operation.newBlockId;
};

Logoot.prototype._receiveInsert = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});
	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}
	const existingNode = this._root.getChildByPath(operation.position, false, CharacterNode);

	// invalid duplication, ignore it
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

Logoot.prototype._receiveInsertBlock = function(operation) {
	const deleteQueueIndex = this._deleteQueue.findIndex(op => {
		return arePositionsEqual(op.position, operation.position);
	});
	if (deleteQueueIndex > -1) {
		this._deleteQueue.splice(deleteQueueIndex, 1);
		return;
	}
	const existingNode = this._root.getChildByPath(operation.position, false, BlockNode);

	// invalid duplication, ignore it
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

	// invalid duplication, ignore it
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

Logoot.prototype._receiveDeleteBlock = function(operation) {
	this._deleteBlock(operation.blockId);
};

Logoot.prototype.insert = function(value, index) {
	value.split('').forEach((character, i) => {
		this._insert(character, index + i);
	});
};

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

function randomBiasedInt(a, b, bias) {
	return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1;
}
function randomAlternation(bias) {
	return Math.random() > 0.5 ? bias : 1 / bias;
}
function doubledBase(depth) {
	return Math.min(BASE * Math.pow(2, depth), MAX);
}

Logoot.prototype._generateNewIdentifier = function(prevInt, nextInt) {
	const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias));
	return new Identifier(int, this.site, this.clock++);
};

Logoot.prototype._generatePositionBetween = function(prevPos, nextPos) {
	const newPos = [];

	const maxLength = Math.max(prevPos.length, nextPos.length);
	let samePrefixes = true;

	for (let depth = 0; depth < maxLength + 1; depth++) {
		const DEPTH_MAX = doubledBase(depth);
		const prevId = prevPos[depth] || new Identifier(MIN, null, null);

		// base doubling
		const nextId =
			samePrefixes && nextPos[depth] ? nextPos[depth] : new Identifier(DEPTH_MAX, null, null);

		const diff = nextId.int - prevId.int;

		if (diff > 1) {
			// enough room for integer between prevInt and nextInt
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

Logoot.prototype.delete = function(index, length = 1) {
	for (let i = 0; i < length; i++) {
		this._delete(index);
	}
};

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

// construct a string from the sequence
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

Logoot.prototype.length = function() {
	return this._root.size - 2;
};

Logoot.prototype.replaceRange = function(value, start, length) {
	this.delete(start, length);
	this.insert(value, start);
};

Logoot.prototype.setValue = function(value) {
	this.replaceRange(value, 0, this.length());
};

function getStateLogoot(logoot) {
	const res = {
		id: logoot.id,
		size: logoot.size,
		empty: logoot.empty,
		type: logoot.type,
		value: logoot.value,
		children: logoot.children.map(getStateLogoot)
	};

	if (logoot.type === 'Block') {
		res['logoot'] = logoot.logoot ? getStateLogoot(logoot.logoot._root) : null;
		res['blockId'] = logoot.blockId;
	}

	return res;
}

Logoot.prototype.getState = function() {
	return JSON.stringify(
		{
			root: getStateLogoot(this._root),
			deleteQueue: this._deleteQueue
		},
		(key, value) => (key === 'parent' ? undefined : value)
	);
};

Logoot.prototype.setState = function(state) {
	const parsed = JSON.parse(state);

	function parseNode(n, parent) {
		const NodeType = createNodeFromType(n.type);
		const node = new NodeType(parseId(n.id), n.value);
		node.parent = parent;
		node.children = n.children.map(c => parseNode(c, node));
		node.size = n.size;
		node.empty = n.empty;
		return node;
	}

	this._root = parseNode(parsed.root, null);
	this._deleteQueue = parsed.deleteQueue;
};

// ***********************************
// | ADDITIONAL FUNCTIONS FOR BLOCKS |
// ***********************************

/**
 * New insertion for characters
 * @param { * } index index of the block
 * @return { * } blockId
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
 * @param { * } content to write
 * @param { * } index of the block to write the value to
 * @param { * } blockId of the block to write to
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
 * @param { * } blockId for searching block
 * @return { * } block node with corresponding id
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
 * @param {*} blockId id for block
 */
Logoot.prototype._deleteBlock = function(blockId) {
	// Find block
	const block = this._searchBlock(blockId);

	// No block is found
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
 * @param {*} blockId id for block
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

module.exports = Logoot;
