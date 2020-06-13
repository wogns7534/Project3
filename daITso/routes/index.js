var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var options={
  host: 'daitso.ckebjmyaqenk.us-east-2.rds.amazonaws.com',
  user: 'root',
  password: '12341234',
  database: 'daitso',
  port: 3306
}
var sessionStore = new MySQLStore(options);
router.use(session({
  secret:"sexydaitso",
  resave:false,
  saveUninitialized:true,
  store: sessionStore
}));

const { fstat } = require('fs');
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');
var connection = mysql.createConnection({
  connectionLimit: 50,
  host: 'daitso.ckebjmyaqenk.us-east-2.rds.amazonaws.com',
  user: 'root',
  password: '12341234',
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

/* GET main page. */
router.get('/', function(req, res) {
  console.log('mainjs . path loaded');
  var display = [];
  if(req.session.customer_name) display = req.session.customer_name + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  res.render('index', {
    title: 'index',
    session: display
  });
});

/* GET index page. */
router.get('/index', function(req, res) {
  console.log('indexjs . path loaded');
  var display = [];
  if(req.session.customer_name) display = req.session.customer_name + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  res.render('index', {
    title: 'index',
    session: display
  });
});

/* GET login page. */
router.get('/login', function(req, res) {
  console.log('loginjs . path loaded');
  res.render('login', {
    title: 'login'
  });
});

/* POST login page. */
router.post('/checksum_customer', function(req, res) {
  var id = req.body.id;
  var passwd = req.body.password;
  console.log("get id : " + id);
  console.log("get password : " + passwd);
  connection.query('SELECT * FROM customer WHERE customer_id = ?', [id],
  function( error, result, fields) {
      if (error) {
          // console.log("error ocurred", error);
          res.send({
              code: 400,
              failed: "error ocurred"
          });
      } else {
          // console.log('The solution is: ', results);
          if(result.length > 0) {
              if(result[0].customer_passwd == passwd) {
                req.session.customer_id = result[0].customer_id;
                req.session.customer_passwd = result[0].customer_passwd;
                req.session.customer_name = result[0].customer_name;
                req.session.customer_address = result[0].customer_address;
                req.session.customer_zipcode = result[0].customer_zipcode;
                req.session.customer_phone = result[0].customer_phone;
                req.session.customer_email = result[0].customer_email;
                req.session.customer_money = result[0].customer_money;
                req.session.save(function(){
                  res.json({
                    title: 'index',
                    message: 'success'
                  });
                });
              } else {
                res.json({
                  title: 'index',
                  message: 'password'
                });
              }
          } else {
            res.json({
              title: 'index',
              message: 'failed'
            });
          }
      }    
  }); 
});

router.get('/logout', function(req, res){
  if(req.session.customer_id){
    req.session.destroy(function(err){
      if(err){
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
});


router.get('/login_customer', function(req, res){
  console.log('login_customer ajax on');
  res.render('login_customer', {
    title: 'login_customer'
  });
});

router.get('/login_seller', function(req, res){
  console.log('login_seller ajax on');
  res.render('login_seller', {
    title: 'login_seller'
  });
});

router.get('/test', function(req, res){
  console.log('sex');
  res.render('transaction_log', {
    title: 'transaction_log'
  });
});



module.exports = router;