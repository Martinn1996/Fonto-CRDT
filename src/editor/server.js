/* eslint-disable no-console */
const express = require('express');
// const http = require('http');

const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

const WebSocket = require('ws').Server;

app.use(express.static('src/editor/static'));

const Logoot = require('../CRDT/src/index');
const l1 = new Logoot('site1');

app.get('/', (_, res) => {
	const editor = fs.readFileSync('./src/editor/static/editor.html');
	res.end(editor);
});

const server = app.listen(port, () => console.log(`App listening on 3000`));

const wss = new WebSocket({ server: server });

const clients = [];

wss.on('connection', function connection(ws) {
	const id = Math.random()
		.toString(36)
		.substring(7);
	clients.push({ client: ws, socketId: id });
	ws.send(JSON.stringify({ assignSocketId: id, initialValue: l1.value() }));

	ws.on('message', function incoming(message) {
		const data = JSON.parse(message);
		l1.receive(data);
		clients.forEach(function each(client) {
			if (data.socketId !== client.socketId) {
				client.client.send(message);
			}
		});
	});
});
