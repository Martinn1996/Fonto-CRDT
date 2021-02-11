module.exports = (crdt, index, text) => {
	crdt.insert(text, index);
};
