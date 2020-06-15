var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var session = require('express-session');                   // import express-session module
var MySQLStore = require('express-mysql-session')(session); // import express-mysql-session module

var options = {                                               // for connect mysql <-> session
  host: 'daitso.ckebjmyaqenk.us-east-2.rds.amazonaws.com',  // detail : mysql에 연동해서 session 정보를 등록해놓지 않으면
  user: 'root',                                             //          session 정보 유지를 위해 서버가 끊기지 않고 무한하게 동작해야 한다.
  password: '12341234',                                     //          mysql과 연동 후 session 정보를 등록해놓으면
  database: 'daitso',                                       //          서버가 끊겨도 session을 유지시킬 수 있다.
  port: 3306
}
var sessionStore = new MySQLStore(options);
router.use(session({
  secret: "sexydaitso",
  resave: false,
  saveUninitialized: true,
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
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/proj3_img/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var up_img = multer({ storage: storage });

connection.connect();



/////////////////////////////////////////////////////////////////////////////////////////
//                                   PRODUCT SECTION                                   //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/products', function(req, res) {
  console.log('products . path loaded');
  //[req.query.bdiv, req.query.sdiv]
  //'SELECT * FROM product WHERE bdiv = ? and sdiv = ?'
  connection.query('SELECT * FROM product WHERE sdiv_no=?', [req.query.sdiv_no],
    function(error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        console.log(result);
        res.render('products', {
          title: 'products',
          products: result
        });
      }
    });
});

router.get('/seller_add_product', function (req, res) {
  console.log('seller_add_product . path loaded');
  res.render('seller_add_product', {
    title: 'seller_add_product'
  });
});

router.post('/seller_add_product', up_img.array('product_img', 3), function(req, res, next) {
  console.log('# Seller add product reuqest arrive.');
  console.log(req.body);
  console.log(req.files);
  var body = req.body;
  var product_name = body.product_name;
  var product_price = body.product_price;
  var product_sale = body.product_sale;
  var detail_description = body.detail_description;
  var product_thumb_img = req.files[0].originalname;
  var product_img = req.files[1].originalname;
  var product_detail_img = req.files[2].originalname;
  var sdiv_no = body.sdiv_no;
  var query = connection.query('insert into product (product_name, detail_description, product_price, product_sale, product_img, product_thumb_img, product_detail_img, sdiv_no) values ("' +
    product_name + '","' +
    detail_description + '","' + product_price + '","' +
    prduct_sale + '","' + product_img + '","' +
    product_thumb_img + '","' +
    product_detail_img + '","' +
    sdiv_no + '")',
    function(err, rows) {
      if (err) {
        throw err;
      }
      console.log("Data inserted!");
    });
  res.redirect('/seller_page');
});

router.get('/seller_page', function(req, res) {
  console.log('seller_page . path loaded');

  connection.query('SELECT * FROM product WHERE seller_id = ?', req.session._id,
    function(error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        console.log(result);
        res.render('seller_page', {
          title: 'seller_page',
          result: result
        });
      }
    });
});


router.get('/product-page', function(req, res) {
  console.log('product-page . path loaded');
  var display=[];
  if(req.session._id) display=req.session_id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴"
  connection.query('SELECT * FROM product WHERE product_no = ?', req.query.product_no,
    function(error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        console.log(result);
        connection.query('select * from review where product_no=?', req.query.product_no,
          function(error2, result2, fields) {
            if (error2) {
              res.send({
                code: 400,
                failed: "error ocurred"
              });
            } else {

              console.log(result2);
              var arr=new Array();
              var total_grade=0;
              var len=result2.length;
              for(var i=0; i<result2.length; i++){
                arr.push(result2[i].review_grade);
                total_grade+=result2[i].review_grade;
              }
              if(len!=0){
                total_grade=Math.ceil(total_grade/result2.length);
              }
              console.log(arr);
              console.log(total_grade);
              console.log(len);
              res.render('product-page', {
                title: 'review',
                review: result2,
                result: result,
                grade: arr,
                p_no: req.query.product_no,
                total_grade: total_grade,
                review_cnt: len,
                session: display
              });
            }
          });
      }
  });
});

router.post('/product-page', function(req, res, next){
  console.log('# product review request arrive.');
  console.log(req.body);
  var body = req.body;
  var customer_id = body.customer_id;
  var review_comment = body.review_comment;
  var review_grade = body.rating;
  var product_no = body.product_no;
  var query = connection.query('insert into review (customer_id, product_no, review_comment, review_grade) values("' +
    customer_id + '","' +
    product_no + '","' + review_comment + '","' +
    review_grade + '")',
    function(err, rows){
      if(err){
        throw err;``
      }
      console.log("review inserted!");
    });
    res.redirect('/product-page?product_no='+product_no);
});

router.get('/seller_modify_product', function(req, res) {
  console.log('seller_modify_product . page loaded');
  connection.query('SELECT * FROM product WHERE product_no = ?', req.query.product_no,
    function(error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        console.log(result);
        res.render('seller_modify_product', {
          title: 'seller_modify_product',
          result: result,
          p_no: req.query.product_no
        });
      }
    });
});

router.post('/seller_modify_product', up_img.array('product_img', 3), function(req, res, next) {
  console.log('# Seller modify product reuqest arrive.');
  console.log(req.body);
  console.log(req.files);
  var body = req.body;
  var product_no = body.product_no;
  var product_name = body.product_name;
  var product_price = body.product_price;
  var product_sale = body.product_sale;
  var detail_description = body.detail_description;
  var product_thumb_img = req.files[0].originalname;
  var product_img = req.files[1].originalname;
  var product_detail_img = req.files[2].originalname;
  var bdiv_no = body.bdiv_no;
  var sdiv_no = body.sdiv_no;

  var sql = "update product set product_name=?, product_price=?, product_sale=?, detail_description=?, product_thumb_img=?, product_img=?, product_detail_img=?, bdiv_no=?, sdiv_no=? where product_no=?"
  var query = connection.query(sql, [product_name, product_price, product_sale, detail_description, product_thumb_img, product_img, product_detail_img, bdiv_no, sdiv_no, product_no], function(err, rows) {
    if (err) {
      throw err;
    }
    console.log("Data modified!");
  });
  res.redirect('/seller_page');
});

/////////////////////////////////////////////////////////////////////////////////////////
//                                   JOIN SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
/* GET join page. */
router.get('/join', function (req, res) {
  console.log('joinjs . path loaded');
  res.render('join', {
    title: 'join'
  });
});

/* GET join_customer page. */
router.get('/join_customer', function (req, res) {
  console.log('join_customerjs . path loaded');
  res.render('join_customer', {
    title: 'join_customer'
  });
});

/* GET join_seller page. */
router.get('/join_seller', function (req, res) {
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

/* POST join_customer page. */
router.post('/join_customer', function (req, res, next) {
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

/* POST join_seller page. */
router.post('/join_seller', function (req, res, next) {
  console.log('# User join_seller reuqest arrive.');
  console.log(req.body);
  var body = req.body;
  var seller_id = body.seller_id;
  var seller_passwd = body.seller_passwd;
  var seller_name = body.seller_name;
  var seller_address = body.addr1 + " " + body.addr2;
  var seller_zipcode = body.zip;
  var seller_mobile = body.seller_mobile;
  var seller_email = body.seller_email;
  var company_number = body.company_number;
  var company_name = body.company_name;

  var query = connection.query('insert into seller (seller_id, seller_passwd, seller_name, seller_address, seller_zipcode, seller_mobile, seller_email, company_number, company_name) values ("'
    + seller_id + '","' + seller_passwd + '","'
    + seller_name + '","' + seller_address + '","'
    + seller_zipcode + '","' + seller_mobile + '","'
    + seller_email + '","' + company_number + '","'
    + company_name + '")',
    function (err, rows) {
      if (err) { throw err; }
      console.log("Data inserted!");
    });
  res.redirect('/join_check');
});

/* ID Check post. */
router.post('/api/idck', function (req, res) {
  var data = req.body.data;
  console.log('idck Parameter = ' + data);

  var result = 0;
  var query = connection.query('select count(*) as namesCount FROM customer,seller WHERE customer_id = "'
    + data + '" or seller_id = "' + data + '"',
    function (err, rows, fields) {
      if (err) { throw err; }
      var result_data = rows[0].namesCount;
      if (result_data > 0) {
        res.send({ result: 1 });
      }
      else {
        res.send({ result: 0 });
      }
    });
});

/* email Check post. */
router.post('/api/emailck', function (req, res) {
  var data = req.body.data;
  console.log('emailck Parameter = ' + data);

  var result = 0;
  var query = connection.query('select count(*) as namesCount FROM customer,seller WHERE customer_email = "'
    + data + '" or seller_email = "' + data + '"',
    function (err, rows, fields) {
      if (err) { throw err; }
      var result_data = rows[0].namesCount;
      if (result_data > 0) {
        res.send({ result: 1 });
      }
      else {
        res.send({ result: 0 });
      }
    });
});

/////////////////////////////////////////////////////////////////////////////////////////
//                              MAIN & INDEX SECTION                                   //
/////////////////////////////////////////////////////////////////////////////////////////
/* GET main page. */
router.get('/', function (req, res) {
  console.log('mainjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  res.render('index', {
    title: 'index',
    session: display
  });
});

/* GET index page. */
router.get('/index', function (req, res) {
  console.log('indexjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  res.render('index', {
    title: 'index',
    session: display
  });
});

/////////////////////////////////////////////////////////////////////////////////////////
//                                   LOGIN SECTION                                     //
/////////////////////////////////////////////////////////////////////////////////////////
/* GET /login : 로그인 버튼 눌렀을 때 가장 최초 접근하는 로그인 페이지  */
router.get('/login', function (req, res) {
  console.log('loginjs . path loaded');
  res.render('login', {
    title: 'login'
  });
});

/* GET /login_customer : 구매자 로그인 버튼 눌렀을 때 ajax 통신용  */
router.get('/login_customer', function (req, res) {
  console.log('login_customer ajax on');
  res.render('login_customer', {
    title: 'login_customer'
  });
});

/* GET /login_seller : 판매자 로그인 버튼 눌렀을 때 ajax 통신용  */
router.get('/login_seller', function (req, res) {
  console.log('login_seller ajax on');
  res.render('login_seller', {
    title: 'login_seller'
  });
});

/* POST /checksum_customer : 구매자 로그인 진행 */
router.post('/checksum_customer', function (req, res) {
  var id = req.body.id;
  var passwd = req.body.password;
  console.log("get id : " + id);
  console.log("get password : " + passwd);
  connection.query('SELECT * FROM customer WHERE customer_id = ?', [id],
    function (error, result, fields) {
      if (error) {
        // console.log("error ocurred", error);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        // console.log('The solution is: ', results);
        if (result.length > 0) {
          if (result[0].customer_passwd == passwd) {
            req.session._id = result[0].customer_id;
            req.session._passwd = result[0].customer_passwd;
            req.session._name = result[0].customer_name;
            req.session._address = result[0].customer_address;
            req.session._zipcode = result[0].customer_zipcode;
            req.session._phone = result[0].customer_phone;
            req.session._email = result[0].customer_email;
            req.session._money = result[0].customer_money;
            req.session._company_number = "";
            req.session._company_name = "";
            req.session.save(function () {
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

/* POST /seller_customer : 판매자 로그인 진행 */
router.post('/checksum_seller', function (req, res) {
  var id = req.body.id;
  var passwd = req.body.password;
  console.log("get id : " + id);
  console.log("get password : " + passwd);
  connection.query('SELECT * FROM seller WHERE seller_id = ?', [id],
    function (error, result, fields) {
      if (error) {
        // console.log("error ocurred", error);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        // console.log('The solution is: ', results);
        if (result.length > 0) {
          if (result[0].seller_passwd == passwd) {
            req.session._id = result[0].seller_id;
            req.session._passwd = result[0].seller_passwd;
            req.session._name = result[0].seller_name;
            req.session._address = result[0].seller_address;
            req.session._zipcode = result[0].seller_zipcode;
            req.session._phone = result[0].seller_mobile;
            req.session._email = result[0].seller_email;
            req.session._company_number = result[0].company_number;
            req.session._company_name = result[0].company_name;
            req.session.save(function () {
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

/* GET /logout : 구매자 & 판매자 로그아웃 진행 */
router.get('/logout', function (req, res) {
  if (req.session._id) {
    req.session.destroy(function (err) {
      if (err) { console.log(err); }
      else { res.redirect('/'); }
    });
  }
  else { res.redirect('/'); }
});


/////////////////////////////////////////////////////////////////////////////////////////
//                                   TEST SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/test', function (req, res) {
  console.log('sex');
  res.render('transaction_log', {
    title: 'transaction_log'
  });
});

module.exports = router;
