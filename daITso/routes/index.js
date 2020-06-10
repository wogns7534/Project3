var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 5,
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

module.exports = router;
