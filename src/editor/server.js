/* eslint-disable no-console */
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8000 });

app.use(express.static('src/editor/static'));

const Logoot = require('../CRDT/src/index');
const l1 = new Logoot('site1');

app.get('/', (_, res) => {
	const editor = fs.readFileSync('./src/editor/static/editor.html');
	res.end(editor);
});

const clients = [];

wss.on('connection', function connection(ws) {
	const id = Math.random()
		.toString(36)
		.substring(7);
	clients.push({ client: ws, socketId: id });
	ws.send(JSON.stringify({ assignSocketId: id, initialValue: l1.value() }));

	ws.on('message', function incoming(message) {
		const data = JSON.parse(message);

		switch (data.method) {
			case 'insert':
				l1.insert(data.value, !data.index ? 0 : data.index);
				break;
			case 'delete':
				l1.delete(!data.index ? 0 : data.index, data.value);
				break;
			default:
				console.log('method not defined');
				break;
		}
		clients.forEach(function each(client) {
			if (data.socketId !== client.socketId) {
				client.client.send(message);
			}
		});
	});
});

app.listen(port, () => console.log(`App listening on 3000`));
