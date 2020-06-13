var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const { fstat } = require('fs');
var connection = mysql.createConnection({
  connectionLimit: 50,
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'daitso',
  port: 3306
});

connection.connect();

/* GET join page. */
router.get('/join', function(req, res) {
  console.log('joinjs . path loaded');
  res.render('join', {
    title: 'join'
  });
});

/* POST join page. */
router.post('/join', function(req,res, next){
  console.log('# User join reuqest arrive.');
  console.log(req.body);
  var body = req.body;
  var customer_id = body.customer_id;
  var customer_passwd = body.customer_passwd;
  var customer_name = body.customer_name;
  var customer_address = body.addr1 + " " + body.addr2;
  var customer_zipcode = body.zip;
  var customer_phone = body.customer_phone;
  var customer_email = body.customer_email;

  var query = connection.query('insert into customer (customer_id, customer_passwd, customer_name, customer_address, customer_zipcode, customer_phone,customer_email) values ("'
                              + customer_id + '","' + customer_passwd + '","'
                              + customer_name + '","' + customer_address + '","'
                              + customer_zipcode + '","' + customer_phone + '","'
                              + customer_email + '")', 
                              function (err, rows) {
      if (err) { throw err; }
      console.log("Data inserted!");
  });
  res.redirect('/join_check');
});

/* GET join_check page. */
router.get('/join_check', function (req, res, next) {
  console.log('join_checkjs . path loaded');
  res.render('join_check', {
    title: 'join_check'
  });
});

/* GET home page. */
router.get('/index', function (req, res, next) {
  console.log('indexjs . path loaded');
  res.render('index', {
    title: 'index'
  });
});

module.exports = router;