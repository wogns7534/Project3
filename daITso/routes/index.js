var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 50,
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'daITso'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('index', {title: 'test'});
  });
});
router.get('/product-page', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('product-page', {title: 'product-page'});
  });
});
router.get('/products', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('products', {title: 'products'});
  });
});

router.get('/modify_info_customer', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('modify_info_customer', {title: 'test'});
  });
});

router.get('/modify_info_seller', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('modify_info_seller', {title: 'test'});
  });
});

router.get('/view_info_seller', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('view_info_seller', {title: 'test'});
  });
});
router.get('/view_info_customer', function(req, res, next) {
  pool.getConnection(function(err, connection){
     res.render('view_info_customer', {title: 'test'});
  });
});

router.get('/seller_page', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('seller_page', {
      title: 'seller_page'
    });
  });
});
router.get('/shoppingcart', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('shoppingcart', {
      title: 'shoppingcart'
    });
  });
});
router.get('/login', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('login', {
      title: 'login'
    });
  });
});

router.get('/seller_add_product', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('seller_add_product', {
      title: 'seller_add_product'
    });
  });
});
router.get('/cpu_product-page', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('cpu_product-page', {
      title: 'cpu_product-page'
    });
  });
});

router.get('/join', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('join', {
      title: 'join'
    });
  });
});
router.get('/join_seller', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('join_seller', {
      title: 'join_seller'
    });
  });
});

router.get('/customer_page', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('customer_page', {
      title: 'customer_page'
    });
  });
});

router.get('/view_infolist_admin', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('view_infolist_admin', {
      title: 'view_infolist_admin'
    });
  });
});
router.get('/view_info_customer_admin', function(req, res, next) {
  pool.getConnection(function(err, connection) {
    res.render('view_info_customer_admin', {
      title: 'view_info_seller_admin'
    });
  });
});
module.exports = router;