var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const { fstat } = require('fs');
var connection = mysql.createConnection({
  connectionLimit: 50,
  host: 'daitso.ckebjmyaqenk.us-east-2.rds.amazonaws.com',
  user: 'root',
  password: '12341234',
  database: 'daitso',
  port: 3306
});
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'public/img/proj3_img/')
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
});
var up_img = multer({storage:storage});

connection.connect();

/* GET join page. */
router.get('/join', function(req, res) {
  console.log('joinjs . path loaded');
  res.render('join', {
    title: 'join'
  });
});

router.get('/products',function(req, res){
  console.log('products . path loaded');
  res.render('products',{
    title: 'products'
  });
});

router.get('/seller_add_product',function(req, res){
  console.log('seller_add_product . path loaded');
  res.render('seller_add_product',{
    title: 'seller_add_product'
  });
});
router.get('/seller_page',function(req, res){
  console.log('seller_page . path loaded');
  res.render('seller_page',{
    title: 'seller_page'
  });
});

router.post('/seller_add_product', up_img.array('product_img',3) ,function(req,res, next){
  console.log('# Seller add product reuqest arrive.');
  console.log(req.body);
  console.log(req.files);
  var body = req.body;
  var product_name = body.product_name;
  var product_price = body.product_price;
  var detail_description = body.detail_description;
  var product_thumb_img = req.files[0].originalname;
  var product_img = req.files[1].originalname;
  var product_detail_img = req.files[2].originalname;
  var classification_no=body.select2;
  var query = connection.query('insert into product (product_name, detail_description, product_price, product_img, product_thumb_img, product_detail_img, classification_no) values ("'
                              + product_name + '","'
                              + detail_description + '","' + product_price + '","'
                              + product_img + '","' + product_thumb_img + '","'
                              + product_detail_img + '","'
                              + classification_no + '")',
                              function (err, rows) {
      if (err) { throw err; }
      console.log("Data inserted!");
  });
  res.redirect('/seller_page');
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

/* GET join page. */
router.get('/join_seller', function(req, res) {
  console.log('join_sellerjs . path loaded');
  res.render('join_seller', {
    title: 'join_seller'
  });
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
  res.render('index', {
    title: 'index'
  });
});

/* GET index page. */
router.get('/index', function(req, res) {
  console.log('indexjs . path loaded');
  res.render('index', {
    title: 'index'
  });
});

/* GET index page. */
router.get('/login', function(req, res) {
  console.log('loginjs . path loaded');
  res.render('login', {
    title: 'login'
  });
});

module.exports = router;
