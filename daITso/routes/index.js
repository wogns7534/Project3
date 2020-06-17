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

  var order_query = req.query.order_by;
  var order_sort = "ASC";

  if(req.query.order_by == "purchase_count") order_sort = "DESC";
  if(req.query.order_by == "total_grade") order_sort = "DESC";
  if(req.query.order_by == "registration_time") order_sort = "DESC";
  if(req.query.order_by == "product_price_low") order_query = "product_sale_price";
  if(req.query.order_by == "product_price_high") {
    order_sort = "DESC";
    order_query = "product_sale_price"
  }

  var start_page = Math.ceil(req.query.page/5) * 5 - 4;
  var end_page = start_page + 4;

  var default_sprice = 0;
  var default_eprice = 99999999;
  if(req.query.sprice != "") default_sprice = req.query.sprice;
  if(req.query.eprice != "") default_eprice = req.query.eprice;

  var default_query = "SELECT * FROM product WHERE sdiv_no=? and product_sale_price between ? and ? ORDER BY " + order_query + " " + order_sort;
  var query_array = [req.query.sdiv_no, default_sprice, default_eprice];


  if(req.query.ct_search != "") {
    default_query = "SELECT * FROM product WHERE sdiv_no=? and product_sale_price between ? and ? and product_name like ? ORDER BY " + order_query + " " + order_sort;
    query_array = [req.query.sdiv_no, default_sprice, default_eprice, "%"+req.query.ct_search+"%"];
  }

  console.log(default_query);
  console.log(query_array);
  connection.query(default_query, query_array,
  function( error, result, fields) {
      if (error) {
          res.send({
              code: 400,
              failed: "error ocurred"
          });
      } else {
          console.log(result);
          res.render('products', {
            title : 'products',
            total_page : Math.ceil(result.length / req.query.page_size),
            current_page : req.query.page,
            page_size: req.query.page_size,
            start_page : start_page,
            end_page : end_page,
            order_by : req.query.order_by,
            m_sdiv_no : req.query.sdiv_no,
            ct_search : req.query.ct_search,
            sprice : default_sprice,
            eprice : default_eprice,
            products : result
          });
      }
  });
});

router.get('/seller_add_product', function (req, res) {
  console.log('seller_add_product . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";
  res.render('seller_add_product', {
    title: 'seller_add_product',
    session: display,
    company: req.session._company_number
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
  var product_sale_price=0;
  var bdiv_no = body.bdiv_no;
  var sdiv_no = body.sdiv_no;
  product_sale_price = (product_price * ((100 - product_sale)/100));
  var query = connection.query('insert into product (product_name, detail_description, product_price, product_sale_price, product_sale, product_img, product_thumb_img, product_detail_img, bdiv_no, sdiv_no) values ("' +
    product_name + '","' +
    detail_description + '","' + product_price + '","' +
    product_sale_price + '","' +
    product_sale + '","' + product_img + '","' +
    product_thumb_img + '","' +
    product_detail_img + '","' +
    bdiv_no + '","' +sdiv_no + '")',
    function(err, rows) {
      if (err) {
        throw err;
      }
      console.log("Data inserted!");
    });
  res.redirect('/seller_page?page=1');
});

router.get('/seller_page', function(req, res) {
  console.log('seller_page . path loaded');
  var start_page = Math.ceil(req.query.page/5) * 5 - 4;
  var end_page = start_page + 4;
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";
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
          result: result,
          session: display,
          company: req.session._company_number,
          start_page: start_page,
          end_page: end_page,
          total_page : Math.ceil(result.length / 10),
          current_page : req.query.page
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
          failed: "error ocurred1"
        });
      } else {
        console.log(result);
        connection.query('select * from review where product_no=?', req.query.product_no,
          function(error2, result2, fields) {
            if (error2) {
              res.send({
                code: 400,
                failed: "error ocurred2"
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
              connection.query('select * from transaction where customer_id=? and product_no=?', [req.session._id, req.query.product_no],
            function(error3, result3, fields){
              if(error3){
                res.send({
                  code: 400,
                  failed: "error ocurred3"
                });
              } else{
                var check=0;
                console.log(result3);
                if(result3.length!=0){  //구매 한 적 있음
                  check=1;
                }
                else{         //구매 한 적 없음
                  check=0;
                }
                res.render('product-page', {
                  title: 'review',
                  review: result2,
                  result: result,
                  grade: arr,
                  p_no: req.query.product_no,
                  total_grade: total_grade,
                  review_cnt: len,
                  session: display,
                  review_check:check,
                  company: req.session._company_number
                });
              }
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
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";
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
          p_no: req.query.product_no,
          session: display,
          company: req.session._company_number
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
  res.redirect('/seller_page?page=1');
});

/* product delete post. */
router.post('/api/delete_product', function (req, res) {
  var data = req.body.data;
  console.log('delete Parameter = ' + data);

  var query = connection.query('delete from product where product_no ='
    + data + ';',
    function (err, rows) {
      if (err) { throw err; }
      console.log("Data delete!");
      res.send({ result: 0 });
    });
});

router.get('/more_review', function(req, res) {
  console.log('more_review . path loaded');
  var date=[]
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";
  connection.query('SELECT * FROM review WHERE product_no = ?', req.query.product_no,
    function(error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        for (var i =0; i<result.length; i++){
        var year=result[i].review_time.getFullYear();
        var month=result[i].review_time.getMonth()+1;
        var day=result[i].review_time.getDate();
        date[i]=year+"년"+month+"월"+day+"일"
      }
        console.log(result[0].review_time);
        res.render('more_review', {
          title: 'more_review',
          review: result,
          date: date,
          session: display,
          company: req.session._company_number
        });
      }
     });
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
    session: display,
    company: req.session._company_number
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
    session: display,
    company: req.session._company_number
  });
});

router.get('/main_search', function(req, res){
  var order_query = req.query.order_by;
  var order_sort = "ASC";

  if(req.query.order_by == "purchase_count") order_sort = "DESC";
  if(req.query.order_by == "total_grade") order_sort = "DESC";
  if(req.query.order_by == "registration_time") order_sort = "DESC";
  if(req.query.order_by == "product_price_low") order_query = "product_sale_price";
  if(req.query.order_by == "product_price_high") {
    order_sort = "DESC";
    order_query = "product_sale_price";
  }

  var start_page = Math.ceil(req.query.page/5) * 5 - 4;
  var end_page = start_page + 4;

  var default_sprice = 0;
  var default_eprice = 99999999;
  if(req.query.sprice != "") default_sprice = req.query.sprice;
  if(req.query.eprice != "") default_eprice = req.query.eprice;

  var default_query = "SELECT * FROM product WHERE product_sale_price between ? and ? ORDER BY " + order_query + " " + order_sort;
  var query_array = [default_sprice, default_eprice, order_query, order_sort];


  if(req.query.main_search != "") {
    default_query = "SELECT * FROM product WHERE product_sale_price between ? and ? and product_name like ? ORDER BY " + order_query + " " + order_sort;
    query_array = [default_sprice, default_eprice, "%"+req.query.main_search+"%", order_query, order_sort];
  }

  connection.query(default_query, query_array,
  function( error, result, fields) {
      if (error) {
          res.send({
              code: 400,
              failed: "error ocurred"
          });
      } else {
        console.log(result[0]);
        console.log(result[1]);
        console.log(result[2]);
          res.render('main_products', {
            title : 'main_products',
            total_page : Math.ceil(result.length / req.query.page_size),
            current_page : req.query.page,
            page_size: req.query.page_size,
            start_page : start_page,
            end_page : end_page,
            order_by : req.query.order_by,
            main_search : req.query.main_search,
            sprice : default_sprice,
            eprice : default_eprice,
            products : result
          });
      }
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
//                               FAQ & QA SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/FAQ', function(req, res){
  console.log('FAQ load');
  res.render('FAQ', {
    title: 'FAQ'
  });
});

router.get('/QA', function(req, res){
  console.log('QA load');
  res.render('QA', {
    title : 'QA'
  });
});

/////////////////////////////////////////////////////////////////////////////////////////
//                            SHOPPINGCART, PURCHASE SECTION                           //
/////////////////////////////////////////////////////////////////////////////////////////

/* GET shoppingcart page. */
router.get('/shoppingcart', function (req, res) {
  var result = new Array();
  var result2 = new Array();
  var cnt = 0;
  var sql = 'select * from product where product_no=?';
  console.log('shoppingcartjs . path loaded');
  connection.query('select * from shoppingcart where customer_id=?', req.session._id,
    function (error, result, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      }
      else {
        console.log(result);
        var len = result.length;
        if (len == 0) {
          res.render('shoppingcart', {
            title: 'shoppingcart',
            result2: 0,
            result: 0
          });
        } else {
          for (var i = 0; i < len; i++) {
            connection.query(sql, result[i].product_no, function (error2, result_temp, fields) {
              result2[cnt++] = result_temp;
              if (cnt == len) {
                res.render('shoppingcart', {
                  title: 'shoppingcart',
                  result2: result2,
                  result: result
                });
                //console.log(result2[1][0]);
                //console.log(result[0]);
              }
            });
          }
        }
      }
    });
});

/* Modify Quantity shoppingcart page. */
router.post('/api/modify_quantity_num', function (req, res) {
  var data = req.body.data;
  var data2 = req.body.data2;
  var data3 = req.body.data3;
  console.log('modify Parameter1 = ' + data);
  console.log('modify Parameter2 = ' + data2);
  console.log('modify Parameter3 = ' + data3);

  var query = connection.query('update shoppingcart set shoppingcart_quantity=' + data2 + ', order_amount = ' + data3
    + ' where product_no='
    + data + ';',
    function (err, rows) {
      if (err) { throw err; }
      console.log("Data update!");
      res.send({ result: 0 });
    });
});

/* Delete shoppingcart page. */
router.post('/api/delete_shopping_cart', function (req, res) {
  var data = req.body.data;

  console.log('Delete Parameter1 = ' + data);

  var query = connection.query('delete from shoppingcart where product_no=' + data + ';',
    function (err, rows) {
      if (err) { throw err; }
      console.log("Data delete!");
      res.send({ result: 0 });
    });
});

/* GET purchase_check page. */
router.get('/purchase_check', function (req, res, next) {
  console.log('purchase_checkjs . path loaded');
  res.render('purchase_check', {
    title: 'purchase_check'
  });
});

/* GET purchase page. */
router.get('/purchase', function (req, res) {
  var result = new Array();
  var result2 = new Array();
  var cnt = 0;
  var sql = 'select * from product where product_no=?';

  console.log('purchasejs . path loaded');
  connection.query('select * from customer where customer_id=?', req.session._id,
    function (error, result3, fields) {
      if (error) {
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      }
      else {
        connection.query('select * from shoppingcart where customer_id=?', req.session._id,
          function (error, result, fields) {
            if (error) {
              res.send({
                code: 400,
                failed: "error ocurred"
              });
            }
            else {
              var display = [];
              if (result.length == 0) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write("<script>");
                res.write("alert('장바구니에 먼저 상품을 담으세요!'); location.href='/shoppingcart';");
                res.write("</script>");
                return;
              }
              else {
                console.log(result);
                var len = result.length;
                for (var i = 0; i < len; i++) {
                  connection.query(sql, result[i].product_no,
                    function (error2, result_temp, fields) {
                      if (error) {
                        res.send({
                          code: 400,
                          failed: "error ocurred"
                        });
                      }
                      else {
                        result2[cnt++] = result_temp;
                        if (cnt == len) {
                          res.render('purchase', {
                            title: 'purchase',
                            result3: result3,
                            result2: result2,
                            result: result
                          });
                          //console.log(result3);
                          //console.log(result2[1][0]);
                          //console.log(result[0]);
                        }
                      }
                    });
                }
              }
            }
          });
      }
    });
});

/* POST purchase page. */
router.post('/purchase', function (req, res, next) {
  console.log('# User purchase reuqest arrive.');
  console.log(req.body.delivery_memo);
  var body = req.body;
  var customer_memo = body.delivery_memo;

  var query = connection.query('insert into transaction (product_no, customer_id, transaction_quantity, order_amount)'
    + ' select product_no, customer_id, shoppingcart_quantity, order_amount' + ' from shoppingcart'
    + ' where customer_id = ?', req.session._id,
    function (err, rows) {
      if (err) { throw err; }
      else {
        var query_2 = connection.query('update transaction set delivery_memo= ' + connection.escape(customer_memo)
          + ' where customer_id = ?', req.session._id,
          function (err, rows) {
            if (err) { throw err; }
            else {
              var query_3 = connection.query('update product, transaction'
                + ' set purchase_count = purchase_count + transaction_quantity'
                + ' where product.product_no = transaction.product_no' + ';',
                function (err, rows) {
                  if (err) { throw err; }
                  else {
                  }
                });
            }
          });
      }
      console.log("Purchase Complete!");
    });
  res.redirect('/purchase_check');
});

/////////////////////////////////////////////////////////////////////////////////////////
//                                   INFO SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////

/* GET view_info_customer page. */
router.get('/view_info_customer', function (req, res, next) {
  console.log('view_info_customerjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM customer WHERE customer_id = '" + req.session._id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].customer_id);
        res.render('view_info_customer', {
          title: 'view_info_customer',
          customer_id: result[0].customer_id,
          customer_passwd: result[0].customer_passwd,
          customer_name: result[0].customer_name,
          customer_address: result[0].customer_address,
          customer_zipcode: result[0].customer_zipcode,
          customer_phone: result[0].customer_phone,
          customer_email: result[0].customer_email,
          customer_money: result[0].customer_money,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* GET withdrawal page. */
router.get('/withdrawal', function (req, res, next) {
  console.log('withdrawaljs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  if (req.session._company_number == "") {  // 구매자
    connection.query("SELECT * FROM customer WHERE customer_id = '" + req.session._id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        } else {
          console.log(result[0].customer_id);
          res.render('withdrawal', {
            title: 'withdrawal',
            id: result[0].customer_id,
            passwd: result[0].customer_passwd,
            session: display,
            company: req.session._company_number
          });
        }
      });
  }
  else {  //판매자
    connection.query("SELECT * FROM seller WHERE seller_id = '" + req.session._id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        } else {
          console.log(result[0].seller_id);
          res.render('withdrawal', {
            title: 'withdrawal',
            id: result[0].seller_id,
            passwd: result[0].seller_passwd,
            session: display,
            company: req.session._company_number
          });
        }
      });
  }
});

/* POST withdrawal page. */
router.post('/withdrawal', function (req, res, next) {
  console.log('# User withdrawal reuqest arrive.');
  console.log(req.body);

  if (req.session._company_number == "") {  // 구매자
    console.log("구매자입니다.");
    connection.query("DELETE FROM customer WHERE customer_id = '" + req.session._id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        } else {
          req.session.destroy(function (err) {
            if (err) { console.log(err); }
          });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write("<script>");
        res.write("alert('성공적으로 회원삭제되었습니다.'); location.href='/';");
        res.write("</script>");
      });
  } else {  //판매자
    console.log("퍈매자입니다.");
    connection.query("DELETE FROM seller WHERE seller_id = '" + req.session._id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        } else {
          req.session.destroy(function (err) {
            if (err) { console.log(err); }
          });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write("<script>");
        res.write("alert('성공적으로 회원삭제되었습니다.'); location.href='/';");
        res.write("</script>");
      });
  }
});

/* POST withdrawal_admin page. */
router.post('/withdrawal_admin', function (req, res, next) {
  console.log('# User withdrawal_admin reuqest arrive.');
  if (req.query.customer_id !== undefined) {  // 구매자
    console.log("구매자입니다.");
    connection.query("DELETE FROM customer WHERE customer_id = '" + req.query.customer_id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write("<script>");
        res.write("alert('성공적으로 구매자 회원이 삭제되었습니다.'); location.href='/view_customerlist_admin';");
        res.write("</script>");
      });
  } else {  //판매자
    console.log("판매자입니다.");
    connection.query("DELETE FROM seller WHERE seller_id = '" + req.query.seller_id + "'",
      function (error, result, fields) {
        if (error) {
          res.send({ code: 400, failed: "error ocurred1" });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write("<script>");
        res.write("alert('성공적으로 판매자 회원이 삭제되었습니다.'); location.href='/view_sellerlist_admin';");
        res.write("</script>");
      });
  }
});

/* GET modify_info_customer page. */
router.get('/modify_info_customer', function (req, res, next) {
  console.log('modify_info_customerjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM customer WHERE customer_id = '" + req.session._id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].customer_id);
        res.render('modify_info_customer', {
          title: 'modify_info_customer',
          customer_id: result[0].customer_id,
          customer_passwd: result[0].customer_passwd,
          customer_name: result[0].customer_name,
          customer_address: result[0].customer_address,
          customer_zipcode: result[0].customer_zipcode,
          customer_phone: result[0].customer_phone,
          customer_email: result[0].customer_email,
          customer_money: result[0].customer_money,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* POST modify_info_customer page. */
router.post('/modify_info_customer', function (req, res, next) {
  console.log('# User modify_info_customer reuqest arrive.');
  console.log(req.body);
  var body = req.body;
  var customer_passwd = body.passwd;
  var customer_email = body.email;
  var customer_phone = body.tel;
  var customer_zipcode = body.zip;
  var customer_address = body.addr1 + body.addr2;

  var sql = "update customer set customer_passwd=?, customer_email=?, customer_phone=?, customer_zipcode=?, customer_address=? where customer_id=?"
  var query = connection.query(sql, [customer_passwd, customer_email, customer_phone, customer_zipcode, customer_address, req.session._id], function (err, rows) {
    if (err) {
      throw err;
    }
    console.log("Data modified!");
  });
  res.redirect('/view_info_customer');
});

/* GET view_info_seller page. */
router.get('/view_info_seller', function (req, res, next) {
  console.log('view_info_sellerjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM seller WHERE seller_id = '" + req.session._id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].seller_id);
        res.render('view_info_seller', {
          title: 'view_info_seller',
          seller_id: result[0].seller_id,
          seller_passwd: result[0].seller_passwd,
          seller_name: result[0].seller_name,
          seller_address: result[0].seller_address,
          seller_zipcode: result[0].seller_zipcode,
          seller_mobile: result[0].seller_mobile,
          seller_email: result[0].seller_email,
          company_number: result[0].company_number,
          company_name: result[0].company_name,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* GET modify_info_seller page. */
router.get('/modify_info_seller', function (req, res, next) {
  console.log('modify_info_sellerjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM seller WHERE seller_id = '" + req.session._id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].seller_id);
        res.render('modify_info_seller', {
          title: 'modify_info_seller',
          seller_id: result[0].seller_id,
          seller_passwd: result[0].seller_passwd,
          seller_name: result[0].seller_name,
          seller_address: result[0].seller_address,
          seller_zipcode: result[0].seller_zipcode,
          seller_mobile: result[0].seller_mobile,
          seller_email: result[0].seller_email,
          company_number: result[0].company_number,
          company_name: result[0].company_name,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* POST modify_info_seller page. */
router.post('/modify_info_seller', function (req, res, next) {
  console.log('# User modify_info_seller reuqest arrive.');
  console.log(req.body);
  var body = req.body;
  var seller_passwd = body.passwd;
  var seller_email = body.email;
  var seller_mobile = body.tel;
  var seller_zipcode = body.zip;
  var seller_address = body.addr1 + body.addr2;

  var sql = "update seller set seller_passwd=?, seller_email=?, seller_mobile=?, seller_zipcode=?, seller_address=? where seller_id=?"
  var query = connection.query(sql, [seller_passwd, seller_email, seller_mobile, seller_zipcode, seller_address, req.session._id], function (err, rows) {
    if (err) {
      throw err;
    }
    console.log("Data modified!");
  });
  res.redirect('/view_info_seller');
});

/* GET view_customerlist_admin page. */
router.get('/view_customerlist_admin', function (req, res, next) {
  console.log('view_customerlist_adminjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT customer_id, customer_email, customer_name FROM customer",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result);
        res.render('view_customerlist_admin', {
          title: 'view_customerlist_admin',
          result: result,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* GET view_sellerlist_admin page. */
router.get('/view_sellerlist_admin', function (req, res, next) {
  console.log('view_sellerlist_adminjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT seller_id, seller_email, seller_name FROM seller",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result);
        res.render('view_sellerlist_admin', {
          title: 'view_sellerlist_admin',
          result: result,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* GET view_info_customer_admin page. */
router.get('/view_info_customer_admin', function (req, res, next) {
  console.log('view_info_customer_adminjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM customer WHERE customer_id = '" + req.query.customer_id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].customer_id);
        res.render('view_info_customer_admin', {
          title: 'view_info_customer_admin',
          id: result[0].customer_id,
          customer_passwd: result[0].customer_passwd,
          customer_name: result[0].customer_name,
          customer_address: result[0].customer_address,
          customer_zipcode: result[0].customer_zipcode,
          customer_phone: result[0].customer_phone,
          customer_email: result[0].customer_email,
          customer_money: result[0].customer_money,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/* GET view_info_seller_admin page. */
router.get('/view_info_seller_admin', function (req, res, next) {
  console.log('view_info_customer_adminjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM seller WHERE seller_id = '" + req.query.seller_id + "'",
    function (error, result, fields) {
      if (error) {
        res.send({ code: 400, failed: "error ocurred1" });
      } else {
        console.log(result[0].seller_id);
        res.render('view_info_seller_admin', {
          title: 'view_info_seller_admin',
          id: result[0].seller_id,
          seller_passwd: result[0].seller_passwd,
          seller_name: result[0].seller_name,
          seller_address: result[0].seller_address,
          seller_zipcode: result[0].seller_zipcode,
          seller_mobile: result[0].seller_mobile,
          seller_email: result[0].seller_email,
          company_number: result[0].company_number,
          company_name: result[0].company_name,
          session: display,
          company: req.session._company_number
        });
      }
    });
});

/////////////////////////////////////////////////////////////////////////////////////////
//                                   TEST SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/view_info_c', function(req, res){
  console.log('sex');
  res.render('view_customerlist_admin', {
    title: 'transaction_log'
  });
});

module.exports = router;
