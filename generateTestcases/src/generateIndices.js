module.exports = logoot => {
	const size = logoot.value().length;
	const res = [];
	for (let i = 0; i <= size; i++) {
		res.push(i);
	}
	return res;
};
