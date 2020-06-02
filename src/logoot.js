const EventEmitter = require('nanobus');

const Identifier = require('./identifier');

const BlockNode = require('./class/BlockNode');
const CharacterNode = require('./class/CharacterNode');
const MergeNode = require('./class/MergeNode');
const Node = require('./class/Node');

const generateString = require('./util/generateCode');
const createNodeFromType = require('./util/createNodeFromType');

const MIN = 0;
const MAX = Number.MAX_SAFE_INTEGER;
const BASE = Math.pow(2, 8);

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
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {boolean} whether a and b are equal
 */
function arePositionsEqual(a, b) {
	if (a.length !== b.length) return false;

	return !a.some((id, index) => {
		return id.compare(b[index]) !== 0;
	});
}

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
	if (node.type === 'Merge') {
		res['referenceId'] = node.referenceId;
	}
	return res;
}

/**
 * Logoot Class
 */
class Logoot extends EventEmitter {
	/**
	 * Logoot instance
	 * @param {string} site of crdt
	 * @param {JSON} state of the tree
	 * @param {Integer} bias
	 */
	constructor(site, state, bias) {
		super();
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
		if (state) {
			this.setState(state);
		}
	}

	/**
	 * Receive function for all the emits
	 * @param {JSON} operation
	 */
	receive(operation) {
		if (!operation.parsed) operation = parseOperation(operation);
		switch (operation.type) {
			case 'mergeBlocks':
				this.receiveMerge(operation);
				break;
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
	}

	receiveMerge(operation) {
		const blockId1 = operation.blockId1;
		const blockId2 = operation.blockId2;
		const block1 = this._searchBlock(blockId1);
		const block2 = this._searchBlock(blockId2);
		if (!block1 || !block2) {
			throw Error('BlockId does not exist');
		}

		const logoot = block1.logoot;
		const deleteQueueIndex = logoot._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			logoot._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}
		const existingNode = logoot._root.getChildByPath(operation.position, false, MergeNode);
		if (existingNode) return;
		const node = logoot._root.getChildByPath(operation.position, true, MergeNode);
		node.referenceId = blockId2;
		node.adjustSize(block2.logoot.length() - 1);

		node.setEmpty(false);

		block2.setMerged();
	}
	/**
	 * Builds the same node as the received inserted node
	 * @param {JSON} operation to perform
	 */
	_receiveInsert(operation) {
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
	}

	/**
	 * Builds the same block node as the received inserted block node
	 * @param {JSON} operation to perform
	 */
	_receiveInsertBlock(operation) {
		const deleteQueueIndex = this._deleteQueue.findIndex(op => {
			return arePositionsEqual(op.position, operation.position);
		});
		if (deleteQueueIndex > -1) {
			this._deleteQueue.splice(deleteQueueIndex, 1);
			return;
		}
		const existingNode = this._root.getChildByPath(
			operation.position,
			false,
			BlockNode,
			Logoot
		);
		if (existingNode) return;
		const node = this._root.getChildByPath(operation.position, true, BlockNode, Logoot);
		const blockId = operation.blockId;
		node.blockId = blockId;
		node.setEmpty(false);
		const index = node.getOrder();
		this.emit('insertBlock', {
			blockId: blockId,
			index: index
		});
	}

	/**
	 * Builds the same block node as the received inserted block node
	 * @param {JSON} operation to perform
	 */
	_receiveInsertInBlock(operation) {
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
	}

	/**
	 * Removes the same node as the received removed node
	 * @param {JSON} operation to perform
	 */
	_receiveDelete(operation) {
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
	}

	/**
	 * Removes the same block node as the received removed block node
	 * @param {JSON} operation to perform
	 */
	_receiveDeleteBlock(operation) {
		this._deleteBlock(operation.blockId);
	}

	/**
	 * Removes the same character node as the received removed character node in a block node
	 * @param {JSON} operation to perform
	 */
	_receiveDeleteInBlock(operation) {
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
	}

	/**
	 * Copies the logoot to the new block (moved block)
	 * @param {JSON} operation to perform
	 */
	_receiveMoveBlock(operation) {
		const oldBlock = this._searchBlock(operation.oldBlockId);
		const newBlock = this._searchBlock(operation.newBlockId);
		if (!oldBlock || !newBlock) {
			throw Error('One of the blocks is not defined');
		}
		newBlock.logoot = oldBlock.logoot;
	}

	/**
	 * Reassigns the id of the block
	 * @param {JSON} operation to perform
	 */

	_changeBlockId(operation) {
		const block = this._searchBlock(operation.oldId);
		if (!block) {
			throw Error(`Could not find block of blockId: ${operation.oldBlockId}`);
		}
		block.blockId = operation.newBlockId;
	}

	/**
	 * Inserts the value into the tree on index
	 * @param {string} value to insert
	 * @param {Integer} index for insertion
	 */
	insert(value, index) {
		value.split('').forEach((character, i) => {
			this._insert(character, index + i);
		});
	}

	_insertMergeNode(index, referenceId) {
		index = Math.min(index, this.length());
		const prev = this._root.getChildByOrder(index);
		const next = this._root.getChildByOrder(index + 1);
		const prevPos = prev.getPath();
		const nextPos = next.getPath();
		const position = this._generatePositionBetween(prevPos, nextPos);
		const node = this._root.getChildByPath(position, true, MergeNode);
		node.referenceId = referenceId;
		node.setEmpty(false);
		return node;
	}

	/**
	 * Inserts the character into the tree on index
	 * @param {string} value to insert
	 * @param {Integer} index for insertion
	 * @return {Array.<number>} path to the newly created node
	 */

	_insert(value, index) {
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
	}

	/**
	 * Generates a new identifier based on previous and next ids
	 * @param {Integer} prevInt id of left neighbor
	 * @param {Integer} nextInt id of right neighbor
	 * @return {Identifier} generated identifier
	 */
	_generateNewIdentifier(prevInt, nextInt) {
		const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias));
		return new Identifier(int, this.site, this.clock++);
	}

	/**
	 * Generates the position between the prevPos and nextPos
	 * @param {Array.<number>} prevPos position of left neighbor
	 * @param {Array.<number>} nextPos position of right neighbor
	 * @return {Array.<number>} generated position
	 */
	_generatePositionBetween(prevPos, nextPos) {
		const newPos = [];
		const maxLength = Math.max(prevPos.length, nextPos.length);
		let samePrefixes = true;
		for (let depth = 0; depth < maxLength + 1; depth++) {
			const DEPTH_MAX = doubledBase(depth);
			const prevId = prevPos[depth] || new Identifier(MIN, null, null);
			const nextId =
				samePrefixes && nextPos[depth]
					? nextPos[depth]
					: new Identifier(DEPTH_MAX, null, null);
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
	}

	/**
	 * Deletes from index 'length' nodes
	 * @param {Integer} index
	 * @param {Integer} length
	 */
	delete(index, length = 1) {
		for (let i = 0; i < length; i++) {
			this._delete(index);
		}
	}

	/**
	 * Deletes the node on index
	 * @param {Integer} index
	 */
	_delete(index) {
		const node = this._root.getChildByOrder(index + 1);
		if (!node || node.id.site === null) return;
		node.setEmpty(true);
		node.trimEmpty();
		this.emit('operation', {
			type: 'delete',
			position: node.getPath()
		});
	}

	/**
	 * Construct a string from the sequence
	 * @return {string} value of the tree
	 */
	value(root = this) {
		const arr = [];
		this._root.walk(node => {
			if (!node.empty && !node.merged) {
				if (node.logoot) {
					arr.push(`${node.logoot.value(root)}\n\n`);
				} else if (node.type === 'Merge') {
					arr.push(root._searchBlock(node.referenceId).logoot.value(root));
				} else {
					arr.push(node.value);
				}
			}
		});
		return arr.join('');
	}

	/**
	 * Returns the size of the root excluding the start and end node
	 * @return {Integer} size of the root
	 */
	length() {
		return this._root.size - 2;
	}

	/**
	 * Replace text in range with value
	 * @param {string} value to write
	 * @param {Integer} start index to delete
	 * @param {Integer} length of deletion
	 */
	replaceRange(value, start, length) {
		this.delete(start, length);
		this.insert(value, start);
	}

	/**
	 * Sets the value of the tree
	 * @param {string} value to write
	 */
	setValue(value) {
		this.replaceRange(value, 0, this.length());
	}

	/**
	 * Returns the state of the JSON
	 * @return {string} stringified JSON representation
	 */
	getState() {
		return JSON.stringify(
			{
				root: getStateLogoot(this._root),
				deleteQueue: this._deleteQueue
			},
			(key, value) => (key === 'parent' ? undefined : value)
		);
	}

	/**
	 * Parse the state into the tree
	 * @param {string} state
	 */
	setState(state) {
		const parsed = JSON.parse(state);
		/**
		 * Function to parse the JSON into the tree
		 * @param {Node} n
		 * @param {Node} parent
		 * @return {Node}
		 */
		function parseNode(n, parent) {
			const NodeType = createNodeFromType(n.type);
			const node = new NodeType(parseId(n.id), n.value, Logoot);
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
	}

	/**
	 * New insertion for characters
	 * @param {Integer} index index of the block
	 * @param {string} id optional id of the block
	 * @return {string} blockId
	 */
	insertBlock(index, id) {
		index = Math.min(index, this.length());
		const prev = this._root.getChildByOrder(index);
		const next = this._root.getChildByOrder(index + 1);
		const prevPos = prev.getPath();
		const nextPos = next.getPath();
		const position = this._generatePositionBetween(prevPos, nextPos);
		const node = this._root.getChildByPath(position, true, BlockNode, Logoot);
		node.setEmpty(false);
		const blockId = id ? id : generateString(5);
		node.blockId = blockId;
		this.emit('operation', {
			type: 'insertBlock',
			position: position,
			blockId: blockId
		});
		return node;
	}

	/**
	 * Inserts the value into the index of block with blockId
	 * @param {string} content to write
	 * @param {Integer} index of the block to write the value to
	 * @param {string} blockId of the block to write to
	 */
	insertContentInBlock(content, index, blockId) {
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
	}

	replaceRangeInBlock(value, start, length, blockId) {
		this.deleteContentInBlock(start, length, blockId);
		this.insertContentInBlock(value, start, blockId);
	}

	/**
	 * Breadth-first search for blocks on id
	 * @param {string} blockId for searching block
	 * @return {BlockNode} block node with corresponding id
	 */
	_searchBlock(blockId) {
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
	}

	/**
	 * Moves the block to the index
	 * @param {string} blockId to perfom on
	 * @param {Integer} index of the position of the new block
	 */
	moveBlock(blockId, index) {
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
	}

	/**
	 * Deletes the block in the tree
	 * @param {string} blockId id for block
	 */
	_deleteBlock(blockId) {
		const block = this._searchBlock(blockId);
		if (!block) {
			console.error(`There does not exist a block of id ${blockId}`);
			return;
		}
		block.logoot = null;
		block.setEmpty(true);
		block.trimEmpty();
	}

	/**
	 * Removes block from tree and communicates with other CRDTs
	 * @param {string} blockId id for block
	 */
	deleteBlock(blockId) {
		this._deleteBlock(blockId);
		this.emit('operation', {
			type: 'deleteBlock',
			position: [new Identifier(0, this.site, this.clock++)],
			blockId: blockId
		});
	}

	/**
	 * Merge two blocks into one and delete the second block
	 * @param {string} blockId1 The first block where all content will be merged into
	 * @param {string} blockId2 The second block which will be deleted after the merge
	 */
	mergeBlocks(blockId1, blockId2) {
		const block1 = this._searchBlock(blockId1);
		const block2 = this._searchBlock(blockId2);
		if (!block1 || !block2) {
			throw Error('BlockId does not exist');
		}

		// insert merge node
		const node = block1.logoot._insertMergeNode(block1.logoot.length(), blockId2);

		node.adjustSize(block2.logoot.length() - 1);
		// set block2 to invisible
		block2.setMerged();

		this.emit('operation', {
			type: 'mergeBlocks',
			position: node.getPath(),
			blockId1: blockId1,
			blockId2: blockId2
		});
	}

	/**
	 * Deletes content in block
	 * @param {Integer} index of start of deletion
	 * @param {Integer} length amount of items to delete
	 * @param {string} blockId of location to delete the content
	 */
	deleteContentInBlock(index, length = 1, blockId) {
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
	}

	/**
	 * Split block into two and moves the content over
	 * @param {string} blockId
	 * @param {Integer} index
	 * @return {BlockNode} newBlock
	 */
	splitBlock(blockId, index) {
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
	}
}

module.exports = Logoot;
