const express = require('express')
const config = require('dotenv').config();
const app = express()
const bodyParser = require('body-parser');
const http = require('http')
var cors = require('cors')
const socketIO = require('socket.io')
var mysql = require('mysql');
const env = process.env
const PORT = env.PORT || 8080

app.use(cors())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var connection = mysql.createConnection({
	host     : '85.10.205.173',
    user     : 'nubdev2001',
    password : 'yuthana0937179329',
    database : 'nubdev_project'
})

connection.connect();

app.get('/',(req,res) => {
	res.send("Api");
})

const server = app.listen(PORT,()=>{
	console.log(`Server Is Running On Port : ${PORT}`)
})

const io = socketIO.listen(server);
io.on('connection', client => {
    console.log('user connected')
  
    client.on('disconnect', () => {
        console.log('user disconnected')
    })
})

app.get('/setting',(req,res) => {
	connection.query(`SELECT text,value FROM setting`, function (error, results, fields) {
		if(results != ""){
			res.json(results)
		}
	  });
})

/*app.post('/setting',(req,res) => {
	const playload = req.body
	const data = playload.data
	//console.log(data)
	if(data){
		for (var i = 1; i <= Object.keys(data).length; i++) {
			if(data[i] == "appdescription"){
				//console.log(data.appdescription)
			}
			//connection.query(`UPDATE setting set value=${value} WHERE text=${data.appdescription}`);
		}
		res.cookie('server',555)
		res.json({status: "success",msg: "อัพเดทสำเร็จ"})
	}
	connection.query(`UPDATE setting set value=${value} WHERE text=${text}`, function (error, results, fields) {
		if(results != ""){
			res.json({status: "success",msg: "อัพเดทสำเร็จ"})
		}
	  });
	  res.send("test")
})*/

app.post('/status',(req,res)=>{
	connection.query(`SELECT * FROM setting WHERE text = "status"`, function (error, results, fields) {
		if(results){
			var status = results[0]['value'];
			if(status == "on"){
				io.emit('status','off')
				connection.query("UPDATE setting SET value='off' WHERE text = 'status'")
			}else{
				io.emit('status','on')
				connection.query("UPDATE setting SET value='on' WHERE text = 'status'")
			}
		}
	  });
	res.json({status: "success",msg: "บันทึสำเร็จ"})
})

app.get('/status',(req,res)=>{
	connection.query(`SELECT * FROM setting WHERE text = "status"`, (error, results, fields) => {
		res.json({status: results[0]['value']})
	})
})

app.post('/show_profile',(req,res) => {
	const payload = req.query;
	const id = payload.id;
	console.log("New a User Id : ",id)
	res.send("Success");
	connection.query(`SELECT * FROM students WHERE code = ${id}`, function (error, results, fields) {
		if (error) throw error;
		if(results != ""){
			io.sockets.emit('profile', results[0])
		}else{
			io.sockets.emit('profile', ['unknown',id])	
		}
	  });
})

app.post('/history/delete',(req,res) => {
	const payload = req.query;
	const id = payload.id;
	if(id){
		connection.query(`DELETE FROM historys WHERE id = ${id}`, function (error, results, fields) {
			if (error) throw error;
			res.json({status:"success",msg: "ลบสำเร็จ"})
		 });
	}
})

app.post('/send_temperature',(req,res) => {
	const payload = req.query;
	const temperature = payload.temperature;
	const id = payload.id;
	res.send("Success");
	if(temperature != "" && id != ""){
		io.sockets.emit('temperature', temperature)
		connection.query(`INSERT INTO historys (user_id,temperature) VALUES (${id},${temperature})`, function (error, results, fields) {
			if (error) throw error;
		 });
	}
	connection.query(`SELECT * FROM historys inner join students on historys.user_id = students.code order by historys.id desc`, function (error, results, fields) {
		if (error) throw error;
		if(results != ""){
			io.sockets.emit('last_check', results)
		}else{
			io.sockets.emit('profile', ['unknown',id])
		}
	 });
	
})

app.get('/history',(req,res) => {
	connection.query(`SELECT *,historys.id as his_id FROM historys inner join students on historys.user_id = students.code order by historys.id desc`, function (error, results, fields) {
		if (error) throw error;
		res.json(results)
	 });
})