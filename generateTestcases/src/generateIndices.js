module.exports.nodeBased = logoot => {
	const size = logoot.length();
	const res = [];
	for (let i = 0; i <= size; i++) {
		res.push(i);
	}
	return res;
};

module.exports.valueBased = logoot => {
	const size = logoot.value().length;
	const res = [];
	for (let i = 0; i <= size; i++) {
		res.push(i);
	}
	return res;
};