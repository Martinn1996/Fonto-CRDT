/* eslint-disable no-undef */
const QuillCursors = require('quill-cursors');
const ejs = require('ejs');
const host = location.origin.replace(/^http/, 'ws');
const Logoot = require('../../src/logoot');
const l1 = new Logoot('site1');

Quill.register('modules/cursors', QuillCursors);

const socket = new WebSocket(host);

socket.onopen = function(_) {};

let initialized = false;
socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	if (data.assignSocketId) {
		l1.setState(data.initialValue);
		render(l1.blockValue());
		initialized = true;
	} else {
		const cursor = getCursor();
		l1.receive(data);
		render(l1.blockValue());
		if (cursor) {
			setCursor(cursor);
		}
	}
};
const supportedOps = [
	'insert',
	'insertBlock',
	'insertInBlock',
	'delete',
	'deleteBlock',
	'deleteInBlock',
	'moveBlock',
	'changeBlockId'
];
l1.on('operation', op => {
	if (initialized && supportedOps.includes(op.type)) {
		socket.send(JSON.stringify(op));
	}
});
const html = `
	<div id="test" class="container">
		<button class="insert" id="insert-0">insert block here</button>
		<% for(let i = 0; i < blocks.length; i++) { %>
		<div class="row">
			Blockid: <%= blocks[i].blockId %>
		</div>
		<div class="row">
			<div class="col-sm-8">
				<div id="<%= blocks[i].blockId %>"></div>
			</div>
			<div class="col-sm-4">
				<button class="delete" id="delete-<%= blocks[i].blockId %>">Delete block</button>
				<button class="split" id="split-<%= blocks[i].blockId %>">Split block</button>
				<div><button class="move" id="move-<%= blocks[i].blockId %>">Move block</button><input id="input-<%= blocks[i].blockId %>" placeholder="Move to"/></div>
			</div>
		</div>
		<div class="row">
			<button class="insert" id="insert-<%= i + 1 %>">insert block here</button>
			<%if (i < blocks.length - 1) { %>
				<button class="merge" id="merge-<%= blocks[i].blockId %>-<%= blocks[i + 1].blockId %>">Merge block</button>
			<% } %>
		</div>
		<% } %>
	</div>
`;
let editors = [];
function getCursor() {
	for (const editor of editors) {
		const cursor = editor.editor.getSelection();
		if (cursor) {
			return { cursor: cursor, blockId: editor.blockId };
		}
	}
	return null;
}

function setCursor(cursor) {
	const editor = editors.filter(e1 => e1.blockId === cursor.blockId);
	if (editor) {
		console.log(editor, cursor);
		editor[0].editor.setSelection(cursor.cursor.index);
	}
}
function render(blocks) {
	$('#editor').html(
		ejs.render(html, {
			blocks: blocks
		})
	);

	editors = blocks.map(block => {
		const quill = new Quill(`#${block.blockId}`, {
			modules: {
				cursors: true,
				toolbar: false
			},
			theme: 'snow'
		});
		quill.on('text-change', function(delta, _, source) {
			if (source === 'user') {
				let retain;
				for (const op of delta.ops) {
					if (op.hasOwnProperty('retain')) {
						retain = op.retain;
					} else if (op.hasOwnProperty('insert')) {
						l1.insertContentInBlock(op.insert, !retain ? 0 : retain, block.blockId);
					} else if (op.hasOwnProperty('delete')) {
						l1.deleteContentInBlock(!retain ? 0 : retain, op.delete, block.blockId);
					}
				}
			}
		});
		quill.setText(block.value);
		return { editor: quill, blockId: block.blockId };
	});
	$('.insert').on('click', e => {
		l1.insertBlock(e.target.id.split('-')[1]);
		render(l1.blockValue());
	});

	$('.delete').on('click', e => {
		l1.deleteBlock(e.target.id.split('-')[1]);
		render(l1.blockValue());
	});

	$('.merge').on('click', e => {
		const blockIds = e.target.id.split('-');
		l1.mergeBlocks(blockIds[1], blockIds[2]);
		render(l1.blockValue());
	});

	$('.split').on('click', e => {
		const blockId = e.target.id.split('-')[1];
		const editor = editors.filter(e1 => e1.blockId === blockId)[0];
		const index = editor.editor.getSelection();
		if (!index) {
			alert('Please add a cursor to show where to split');
			return;
		}
		l1.splitBlock(blockId, index.index);
		render(l1.blockValue());
	});

	$('.move').on('click', e => {
		const blockId = e.target.id.split('-')[1];
		const index = parseInt($(`#input-${blockId}`).val(), 10);
		if (index !== 0 && !index) {
			alert('please enter a valid index');
			return;
		}
		l1.moveBlock(blockId, index);
		render(l1.blockValue());
	});
}
