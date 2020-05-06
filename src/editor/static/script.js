const QuillCursors = require('quill-cursors');
const host = location.origin.replace(/^http/, 'ws');
const Logoot = require('../../CRDT/src/index');
const l1 = new Logoot('site1');

Quill.register('modules/cursors', QuillCursors);

const quill = new Quill('#editor', {
	modules: {
		cursors: true
	},
	theme: 'snow'
});

const socket = new WebSocket(host);

socket.onopen = function(e) {};
let socketId = -1;

socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	let cursor = quill.getSelection();
	if (cursor) {
		cursor.index = cursor ? cursor.index : 0;
	} else {
		cursor = { index: 0 };
	}
	if (data.assignSocketId) {
		socketId = data.assignSocketId;
		l1.setValue(data.initialValue);
		quill.setText(l1.value());
	} else {
		const index = !data.index ? 0 : data.index;
		switch (data.method) {
			case 'insert':
				l1.insert(data.value, index);
				cursor.index = cursor.index + (index > cursor.index ? 0 : data.value.length);
				break;
			case 'delete':
				l1.delete(index, data.value);
				cursor.index = cursor.index - (index > cursor.index ? data.value.length : 0);
				break;
			default:
				console.log('method not defined');
				break;
		}
		quill.setText(l1.value());
		if (cursor) quill.setSelection(cursor.index, 0);
	}
};

socket.onclose = function(_) {};

socket.onerror = function(_) {
	// alert(`[error] ${error.message}`);
};

quill.on('text-change', function(delta, _, source) {
	if (source === 'user') {
		let retain;
		for (const op of delta.ops) {
			if (op.hasOwnProperty('retain')) {
				retain = op.retain;
			} else if (op.hasOwnProperty('insert')) {
				l1.insert(op.insert, !retain ? 0 : retain);
				socket.send(
					JSON.stringify({
						method: 'insert',
						value: op.insert,
						index: !retain ? 0 : retain,
						socketId: socketId
					})
				);
			} else if (op.hasOwnProperty('delete')) {
				l1.delete(!retain ? 0 : retain, op.delete);
				socket.send(
					JSON.stringify({
						method: 'delete',
						value: op.delete,
						index: !retain ? 0 : retain,
						socketId: socketId
					})
				);
			}
		}
	}
});
