class Node {
	constructor(id) {
		this.id = id;
		this.children = [];
		this.parent = null;
		this.size = 1;
		this.empty = false;
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

module.exports = Node;
