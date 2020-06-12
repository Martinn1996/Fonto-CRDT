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
			if (!this.merged) this.adjustSize(-1);
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
	 * @return {Array.<number>} path to get to this node
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
	 * @param {Array.<number>} path to find the child
	 * @param {boolean} build whether to build or just search
	 * @param {Node} NodeType node type to build
	 * @param {Constructor} LogootConstructor Constructor for a Logoot instance
	 * @return {Node} of the child
	 */
	getChildByPath(path, build, NodeType, LogootConstructor) {
		let current = this;
		let next = null;

		path.every(id => {
			next = current.getChildById(id);

			if (!next && !build) {
				current = null;
				return false;
			}

			if (!next && build) {
				next = NodeType ? new NodeType(id, null, LogootConstructor) : new Node(id);

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
	 * Find child (excluding merged blocks) with corresponding index
	 * @param {Integer} index of the child
	 * @return {Node}
	 */
	getChildByOrderLocal(index) {
		if (index === 0 && !this.empty) return this;

		let left = this.empty ? 0 : 1;
		let right = left;

		for (const child of this.children) {
			right += child.size;
			if (left <= index && right > index) {
				return child.getChildByOrderLocal(index - left);
			}
			left = right;
		}

		return null;
	}

	/**
	 * Find child (including merged blocks) with corresponding index
	 * @param {Integer} i is index of the child
	 * @param {Logoot} logoot of the entire CRDT
	 * @return {Node}
	 */
	getChildByOrder(i, logoot) {
		let index = 0;
		const dfs = node => {
			if (!node.empty && index === i && node.type !== 'Merge' && !node.merged) {
				return node;
			}
			if (!node.empty && node.type && node.type !== 'Merge' && !node.merged) {
				index++;
			}

			for (const child of node.children) {
				if (child.type === 'Merge') {
					const block = logoot._searchAllBlock(child.referenceId);
					if (i - index < block.logoot.length()) {
						return { ref: child, block: block, index: i - index + 1 };
					}
					return block.logoot._root.getChildByOrder(i - index + 1, logoot);
				}

				const res = dfs(child, logoot);

				if (res) return res;
			}
		};

		return dfs(this, logoot);
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

module.exports = Node;
