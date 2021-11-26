const express = require('express');
const app = express();
const mongourl = 'mongodb://lolohk789:E4512379a@cluster0-shard-00-00.gh4x8.mongodb.net:27017,cluster0-shard-00-01.gh4x8.mongodb.net:27017,cluster0-shard-00-02.gh4x8.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-u99ecw-shard-0&authSource=admin&retryWrites=true&w=majority';
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fileUpload = require('express-fileupload');
// var multer = require('multer');
// var upload = multer();
app.set('view engine', 'ejs');
//for session
const SECRETKEY = 'I want to pass COMPS381F';
const session = require('cookie-session');
//for get POST data
const bodyParser = require('body-parser');
//for File To Upload
const fs = require('fs');
// grt Incoming form data
const formidable = require('formidable');
// for CRUD and check formatt
const mongoose = require('mongoose');
const bookingSchema = mongoose.Schema({
	bookingid: String,
	mobile: String,
	photo: String,
});



// store users 
const users = new Array(
	{ name: 'developer', password: 'developer' },
	{ name: 'guest', password: 'guest' },
	{ name: 'dome', password: '' }
);

// use ejs in express
app.set('view engine', 'ejs');

app.use(session({
	name: 'loginSession',
	keys: [SECRETKEY]
}));

// support parsing of application/json type POST data
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('images'));
// app.use(upload.array()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// routing------------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
	console.log(req.session);
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		console.log(req.query);
		handle_Find(res, req.query);// call home.ejs to show booking id and
	}
});

app.get('/details', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		console.log(req.query);
		handle_Details(res, req.query)// call details.ejs to show booking details
	}
});

app.get('/edit', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		console.log(req.query);
		handle_Edit(res, req.query)
	}
});

app.post('/update', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		if(req.files != null && req.files.file != null){
			var file = req.files.file
			file.mv('./images/' + file.name);
			req.body.fileName = "http://localhost:8099/" + file.name
		}
		handle_Update(res, req)
	}
});







app.get('/login', (req, res) => {
	res.status(200).render('login', {});
});

app.post('/login', (req, res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			// correct user name + password
			// store the following name/value pairs in cookie session
			req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.name;	 // 'username': req.body.name		
		}
	});
	res.redirect('/');
});

app.get('/logout', (req, res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);

// --------------------------CRUD------------------------------------------------------------------------------




const handle_Find = (res, criteria) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.find(criteria, (err, docs) => {
			if (err) return console.error(err);
			res.render('home.ejs', {
				docs
			});
		})
	})
}


// const handle_Details = (res, criteria) => {
// 	const client = new MongoClient(mongourl);
// 	client.connect((err) => {
// 		assert.equal(null, err);
// 		console.log("Connected successfully to server");
// 		const db = client.db(dbName);

// 		/* use Document ID for query */
// 		let DOCID = {};
// 		DOCID['_id'] = ObjectID(criteria._id)
// 		findDocument(db, DOCID, (docs) => {  // docs contain 1 document (hopefully)
// 			client.close();
// 			console.log("Closed DB connection");
// 			res.status(200).render('details', {
// 				docs
// 			});
// 		});
// 	});
// }

const handle_Details = (res, criteria) => {
	mongoose.connect(mongourl);

	let db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		/* use Document ID for query */
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria._id)
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.findOne(DOCID, (err, docs) => {
			if (err) return console.error(err);
			res.status(200).render('details.ejs', {
				docs
			});
		});
	});
}



const handle_Edit = (res, criteria) => {
	mongoose.connect(mongourl);

	let db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		/* use Document ID for query */
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria._id)
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.findOne(DOCID, (err, docs) => {
			if (err) return console.error(err);
			res.status(200).render('edit.ejs', {
				docs
			});
		});
	});
}


const handle_Update = (res, criteria) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		/* use Document ID for query */
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria.body._id)
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.findOne(DOCID, (err, docs) => {
			//console.log(docs);
			docs.bookingid = criteria.body.bookingid;
			docs.mobile = criteria.body.mobile;
			if(criteria.body.fileName != null)
				docs.photo = criteria.body.fileName
			docs.save(err => {
						res.status(200).render('update.ejs', {
							docs
						});
					})
			// const form = new formidable.IncomingForm();
			// if (files.fileToUpload.size > 0) {
			// 	form.parse(req, (err, fields, files) => {
			// 		fs.readFile(files.fileToUpload.path, (err, data) => {
			// 			assert.equal(err, null);
			// 			docs.photo = new Buffer.from(data).toString('base64');
			// 		})
			// 	})
			// 	docs.save(err => {
			// 		res.status(200).render('update.ejs', {
			// 			docs
			// 		});
			// 	})
			// }else {
			// 	docs.save(err => {
			// 		res.status(200).render('update.ejs', {
			// 			docs
			// 		});
			// 	})
			// }
			// docs.body.photo=new Buffer.from(data).toString('base64');
			// docs.body.photo = criteria.photo;
			
		})
	})
}



// const handle_UpdateAAA = (req, res, criteria) => {
// 	// Q2
// 	const form = new formidable.IncomingForm();
// 	form.parse(req, (err, fields, files) => {
// 		var DOCID = {};
// 		DOCID['_id'] = ObjectID(fields._id);
// 		var updateDoc = {};
// 		updateDoc['bookingid'] = fields.bookingid;
// 		updateDoc['mobile'] = fields.mobile;
// 		if (files.fileToUpload.size > 0) {
// 			fs.readFile(files.fileToUpload.path, (err, data) => {
// 				assert.equal(err, null);
// 				updateDoc['photo'] = new Buffer.from(data).toString('base64');
// 				updateDocument(DOCID, updateDoc, (results) => {
// 					res.writeHead(200, { "content-type": "text/html" });
// 					res.write(`<html><body><p>Updated ${results.result.nModified} document(s)<p><br>`);
// 					res.end('<a href="/">back</a></body></html>');
// 				});
// 			});
// 		} else {
// 			updateDocument(DOCID, updateDoc, (results) => {
// 				res.writeHead(200, { "content-type": "text/html" });
// 				res.write(`<html><body><p>Updated ${results.result.nModified} document(s)<p><br>`);
// 				res.end('<a href="/">back</a></body></html>');
// 			});
// 		}
// 	})
// 	// end of Q2
// }