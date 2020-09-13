const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const sqlite3 = require('sqlite3').verbose()

let db = new sqlite3.Database('./db/lab.db', sqlite3.OPEN_READWRITE, err => {
	if (err) {
		return console.error(err.message);
	}

	// 1 
	console.log('[i] connected to the *lab.db SQlite database.')

	// 2
	const serial_port = new SerialPort('COM1', { baudRate: 9600 })
	const serial_parser = new Readline()
	serial_port.pipe(serial_parser)

	serial_port.on('data', data => {
		let v = data.toString('utf8').split(',')
		let q = 'INSERT INTO rfid_temperature(rfid,temperature) VALUES(?,?)'
		
		db.run(q, [v[0], v[1]], err => {
			if (err) {
				return console.log('[e]', err.message)
			}

			console.log('[+] a row has been inserted')
			io.emit('db-serial', v)
		})
	})

	// - - - - -
	io.on('connection', socket => {
		console.log('[i] user connected.',`( ${socket.id} )`)

		socket.on('db-get-room', () => {
			console.log('get-room from ', `( ${socket.id} )`)
			let q = 'SELECT DISTINCT room FROM room'
			db.all(q, [], (err,rows) => {
				socket.emit('db-room', rows)
			})
		})
	})
	// - - - - -
})

server.listen(3000, ()=>{
	console.log('[i] io server listening on *:3000')
})