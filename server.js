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
	inventory_ID: String,
	name: { type: String,required: true },
	type: String,
	quantity: String,
	photo: String,
	photoMimetype: String,
	inventory_address: {
		street: String,
		building: String,
		country: String,
		zipcode: String,
		coord: String
	},
	manager: { type: String,required: true },
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

//API------------------------------------------------------------------------------------------------------------
app.get('/api/inventory/name/:name', (req, res) => {
	var s =req.params.name
	handle_Name_Api(res,s)
	
});
// Routing------------------------------------------------------------------------------------------------------

app.get('/', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		handle_Find(res, req.query, req.session.username);// call home.ejs to show booking id and
	}
});

app.get('/details', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		handle_Details(res, req.query)// call details.ejs to show booking details
	}
});

app.get('/edit', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		handle_Edit(res, req.query)
	}
});

app.get('/delete', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		handle_Delete(res, req)
	}
});


app.get('/create', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		res.render('create.ejs', {});
	}
});

app.get('/map', (req, res) => {

	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		var lat = req.query.lat
		var lon = req.query.lon
		res.render('map.ejs', {
			lat,
			lon
		});
	}
});


app.post('/create', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		if (req.files != null && req.files.file != null) {
			var file = req.files.file
			file.mv('./images/' + file.name);
			req.body.fileName = req.protocol + '://' + req.get('host') + "/" + file.name
		}
		handle_Create(res, req)
		
	}
});

app.post('/update', (req, res) => {
	if (!req.session.authenticated) {   // user not logged in!
		res.redirect('/login');
	} else {
		if (req.files != null && req.files.file != null) {
			var file = req.files.file
			file.mv('./images/' + file.name);
			req.body.fileName = req.protocol + '://' + req.get('host') + "/" + file.name
		}
		handle_Update(res, req)
	}
});







app.get('/login', (req, res) => {
	
		res.status(200).render('login', {});///
	
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
const handle_Find = (res, criteria, name) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.find(criteria, (err, docs) => {
			if (err) return console.error(err);
			res.render('home.ejs', {
				docs,
				name
			});
		})
	})
}


const handle_Delete = (res, criteria) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria.query._id)
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.findOne(DOCID, (err, docs) => {
			if (err) return console.error(err);
			console.log(docs);
			if (docs.manager != criteria.session.username) {
				res.status(200).render('deleteError.ejs', {});
			}else{
				docs.remove()
				res.status(200).render('delete.ejs', {});
			}
		});
	})
}


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
			const s = docs.inventory_address.coord.split(",")
			res.status(200).render('details.ejs', {
				docs,
				s
			});
		});
	});
}



const handle_Name_Api = (res, criteria) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		/* use Document ID for query */
		let DOCID = {};
		DOCID['name'] = criteria
		const Booking = mongoose.model('booking', bookingSchema);
		Booking.find(DOCID, (err, docs) => {
			// var jsonData = JSON.stringify(docs)
			// res.status(200).render('nameAPI.ejs', {
			// 	jsonData
			// });
			res.json(docs)
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
			const s = docs.inventory_address.coord.split(",")
			res.status(200).render('edit.ejs', {
				docs,
				s
			});
		});
	});
}

const handle_Create = (res, criteria) => {
	mongoose.connect(mongourl);
	let db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		/* use Document ID for query */
		const Booking = mongoose.model('booking', bookingSchema);
		BookingOne = new Booking({
			inventory_ID: criteria.body.inventory_ID,
			name: criteria.body.name,
			type: criteria.body.type,
			quantity: criteria.body.quantity,
			photo: criteria.body.fileName,
			photoMimetype: criteria.body.photoMimetype,
			inventory_address: {
				street: criteria.body.street,
				building: criteria.body.building,
				country: criteria.body.country,
				zipcode: criteria.body.zipcode,
				coord: criteria.body.latitude+","+criteria.body.longitude
			},
			manager: criteria.session.username
		})
		BookingOne.save(err => {
			res.status(200).render('createOK.ejs', {});
		})
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
			if (err) return console.error(err);
			if (docs.manager != criteria.session.username) {
				res.status(200).render('updateError.ejs', {});
			} else {
				docs.inventory_ID = criteria.body.inventory_ID;
				docs.name = criteria.body.name;
				docs.type = criteria.body.type;
				docs.quantity = criteria.body.quantity;
				docs.photoMimetype = criteria.body.photoMimetype;
				docs.inventory_address.street = criteria.body.street;
				docs.inventory_address.building = criteria.body.building;
				docs.inventory_address.country = criteria.body.country;
				docs.inventory_address.zipcode = criteria.body.zipcode;
				docs.inventory_address.coord = criteria.body.latitude + "," + criteria.body.longitude;

				if (criteria.body.fileName != null)
					docs.photo = criteria.body.fileName
				docs.save(err => {
					if (err) {
						res.status(200).render('InputRequired.ejs', {
							docs
						});
					} else {
						res.status(200).render('update.ejs', {
							docs
						});
					}
				})
			}

		})
	})
}



