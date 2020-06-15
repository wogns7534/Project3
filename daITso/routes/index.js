var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var session = require('express-session');                   // import express-session module
var MySQLStore = require('express-mysql-session')(session); // import express-mysql-session module

var options={                                               // for connect mysql <-> session
  host: 'daitso.ckebjmyaqenk.us-east-2.rds.amazonaws.com',  // detail : mysql에 연동해서 session 정보를 등록해놓지 않으면
  user: 'root',                                             //          session 정보 유지를 위해 서버가 끊기지 않고 무한하게 동작해야 한다.
  password: '12341234',                                     //          mysql과 연동 후 session 정보를 등록해놓으면
  database: 'daitso',                                       //          서버가 끊겨도 session을 유지시킬 수 있다.
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


/////////////////////////////////////////////////////////////////////////////////////////
//                                   MAIN SEARCH SECTION                               //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/main_search', function(req, res){
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

  var default_query = "SELECT * FROM product WHERE product_sale_price between ? and ? ORDER BY ? ? ";
  var query_array = [default_sprice, default_eprice, order_query, order_sort];


  if(req.query.main_search != "") {
    default_query = "SELECT * FROM product WHERE product_sale_price between ? and ? and product_name like ? ORDER BY ? ?";
    query_array = [default_sprice, default_eprice, "%"+req.query.main_search+"%", order_query, order_sort];
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
//                                   PRODUCT SECTION                                   //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/products',function(req, res){
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

  var default_query = "SELECT * FROM product WHERE sdiv_no=? and product_sale_price between ? and ? ORDER BY ? ? ";
  var query_array = [req.query.sdiv_no, default_sprice, default_eprice, order_query, order_sort];


  if(req.query.ct_search != "") {
    default_query = "SELECT * FROM product WHERE sdiv_no=? and product_sale_price between ? and ? and product_name like ? ORDER BY ? ?";
    query_array = [req.query.sdiv_no, default_sprice, default_eprice, "%"+req.query.ct_search+"%", order_query, order_sort];
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


/////////////////////////////////////////////////////////////////////////////////////////
//                                   JOIN SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
/* GET join page. */
router.get('/join', function(req, res) {
  console.log('joinjs . path loaded');
  res.render('join', {
    title: 'join'
  });
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

/////////////////////////////////////////////////////////////////////////////////////////
//                              MAIN & INDEX SECTION                                   //
/////////////////////////////////////////////////////////////////////////////////////////
/* GET main page. */
router.get('/', function(req, res) {
  console.log('mainjs . path loaded');
  var display = [];
  if(req.session._id) display = req.session._id + "님, 안녕하세요!";
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
  if(req.session._id) display = req.session._id + "님, 안녕하세요!";
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
router.get('/login', function(req, res) {
  console.log('loginjs . path loaded');
  res.render('login', {
    title: 'login'
  });
});

/* GET /login_customer : 구매자 로그인 버튼 눌렀을 때 ajax 통신용  */
router.get('/login_customer', function(req, res){
  console.log('login_customer ajax on');
  res.render('login_customer', {
    title: 'login_customer'
  });
});

/* GET /login_seller : 판매자 로그인 버튼 눌렀을 때 ajax 통신용  */
router.get('/login_seller', function(req, res){
  console.log('login_seller ajax on');
  res.render('login_seller', {
    title: 'login_seller'
  });
});

/* POST /checksum_customer : 구매자 로그인 진행 */
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

/* POST /seller_customer : 판매자 로그인 진행 */
router.post('/checksum_seller', function(req, res) {
  var id = req.body.id;
  var passwd = req.body.password;
  console.log("get id : " + id);
  console.log("get password : " + passwd);
  connection.query('SELECT * FROM seller WHERE seller_id = ?', [id],
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
              if(result[0].seller_passwd == passwd) {
                req.session._id = result[0].seller_id;
                req.session._passwd = result[0].seller_passwd;
                req.session._name = result[0].seller_name;
                req.session._address = result[0].seller_address;
                req.session._zipcode = result[0].seller_zipcode;
                req.session._phone = result[0].seller_mobile;
                req.session._email = result[0].seller_email;
                req.session._company_number = result[0].company_number;
                req.session._company_name = result[0].company_name;
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

/* GET /logout : 구매자 & 판매자 로그아웃 진행 */
router.get('/logout', function(req, res){
  if(req.session._id){
    req.session.destroy(function(err){
      if(err) { console.log(err); } 
      else    { res.redirect('/'); }
    });
  }
  else { res.redirect('/'); }
});


/////////////////////////////////////////////////////////////////////////////////////////
//                                   TEST SECTION                                      //
/////////////////////////////////////////////////////////////////////////////////////////
router.get('/test', function(req, res){
  console.log('sex');
  res.render('transaction_log', {
    title: 'transaction_log'
  });
});

module.exports = router;
