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

module.exports = router;
