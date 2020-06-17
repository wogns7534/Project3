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
  if(req.session._id) display=req.session._id + "님, 안녕하세요!";
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
              var len=result2.length;

              for(var i=0; i<result2.length; i++){
                arr.push(result2[i].review_grade);
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
                  review_cnt: len,
                  session: display,
                  review_check:check
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
  var total_grade = body.rating;
  var product_no = body.product_no;

  connection.query('select review_grade from review where product_no = ' + product_no,
  function(err, q_grade){
    if(err){throw err;}
    else{
      
      for( var l = 0; l < q_grade.length; l++ ){
        total_grade = total_grade + q_grade[i].review_grade;
      }
      total_grade = total_grade / (q_grade.length + 1);
      connection.query('insert into review (customer_id, product_no, review_comment, review_grade) values("' +
      customer_id + '","' +
      product_no + '","' + review_comment + '","' +
      body.rating + '")',
      function(err, rows){
          if(err){ throw err;}
          else {
            connection.query('update product set total_grade=' + total_grade + ' where product_no=' + product_no,
            function(err, result){
              if(err){ throw err;}
              else {
                console.log("review inserted!");
                res.redirect('/product-page?product_no='+product_no);
              }
            });
          }
      });
    }
  });
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

  connection.query('select * from product where total_grade = 5 limit 0, 10',
  function(err, rating_result, fields){
    if(err){ throw err; }
    else {
      connection.query('select * from product where product_sale > 0 order by product_sale DESC limit 0, 10',
      function(err, sale_result, fields){
        if(err){ throw err; }
        else {
          connection.query('select * from product where sdiv_no=11 order by purchase_count DESC limit 0, 5',
          function(err, count_result, fields){
            if(err){ throw err; }
            else {
              connection.query('select * from product where sdiv_no=41 order by purchase_count DESC limit 0, 5',
              function(err, cpu_result, fields){
                if(err){ throw err; }
                else {
                  connection.query('select * from product where sdiv_no=44 order by purchase_count DESC limit 0, 5',
                  function(err, gpu_result, fields){
                    if(err){ throw err; }
                    else {
                      res.render('index', {
                        title: 'index',
                        session: display,
                        company: req.session._company_number,
                        rating_result : rating_result,
                        sale_result : sale_result,
                        count_result : count_result,
                        cpu_result : cpu_result,
                        gpu_result : gpu_result
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

/* GET index page. */
router.get('/index', function (req, res) {
  console.log('mainjs . path loaded');
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query('select * from product where total_grade = 5 limit 0, 10',
  function(err, rating_result, fields){
    if(err){ throw err; }
    else {
      connection.query('select * from product where product_sale > 0 order by product_sale DESC limit 0, 10',
      function(err, sale_result, fields){
        if(err){ throw err; }
        else {
          connection.query('select * from product where sdiv_no=11 order by purchase_count DESC limit 0, 5',
          function(err, count_result, fields){
            if(err){ throw err; }
            else {
              connection.query('select * from product where sdiv_no=41 order by purchase_count DESC limit 0, 5',
              function(err, cpu_result, fields){
                if(err){ throw err; }
                else {
                  connection.query('select * from product where sdiv_no=44 order by purchase_count DESC limit 0, 5',
                  function(err, gpu_result, fields){
                    if(err){ throw err; }
                    else {
                      res.render('index', {
                        title: 'index',
                        session: display,
                        company: req.session._company_number,
                        rating_result : rating_result,
                        sale_result : sale_result,
                        count_result : count_result,
                        cpu_result : cpu_result,
                        gpu_result : gpu_result
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
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
        for (var i = 0; i < len; i++) {
          connection.query(sql, result[i].product_no, function (error2, result_temp, fields) {
            result2[cnt++] = result_temp;
            if (cnt == len) {
              res.render('shoppingcart', {
                title: 'shoppingcart',
                result2: result2,
                result: result
              });
              console.log(result2[1][0]);
              console.log(result[0]);
            }
          });
        }
      }
    });
});

/* Modify Quantity shoppingcart page. */
router.post('/api/modify_quantity_num', function (req, res) {
  var data = req.body.data;
  var data2 = req.body.data2;
  console.log('modify Parameter1 = ' + data);
  console.log('modify Parameter2 = ' + data2);

  var query = connection.query('update shoppingcart set shoppingcart_quantity=' + data2 + ' where product_no='
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
              console.log(result);
              var len = result.length;
              for (var i = 0; i < len; i++) {
                connection.query(sql, result[i].product_no, function (error2, result_temp, fields) {
                  result2[cnt++] = result_temp;
                  if (cnt == len) {
                    res.render('purchase', {
                      title: 'purchase',
                      result3: result3,
                      result2: result2,
                      result: result
                    });
                    console.log(result3);
                    console.log(result2[1][0]);
                    console.log(result[0]);
                  }
                });
              }
            }
          });
      }
    });
});

/* POST purchase page. */
router.post('/purchase', function (req, res, next) {
  console.log('# User purchase reuqest arrive.');
  console.log(req.body);
  var sql = 'select * from shoppingcart';
  
});

router.post('/insert_shoppingcart', function(req,res){
  console.log('# User insert shoppping cart');


//   insert into shoppingcart values(3,'admin',2,251000);
// insert into shoppingcart values(4,'admin',1,748000);
// insert into shoppingcart values(5,'admin',6,468000);
})

/////////////////////////////////////////////////////////////////////////////////////////
//                                   POINT SECTION                                     //
/////////////////////////////////////////////////////////////////////////////////////////
/* 구매자 / 관리자 충전 로그 페이지 */
router.get('/point_charge_log', function(req, res){
  console.log('point charge log load...');

  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  if(req.session._id == "admin"){   // 관리자 일 때
    connection.query("SELECT * FROM point order by charge_time DESC",
    function(err, result, field){
      if(err) {throw err;}
      else {
        res.render('point_charge_log', {
          title: '관리자 포인트 충전 관리',
          session: display,
          company: req.session._company_number,
          result: result
        });
      }
    });
  }
  else {          // 구매자 일 때
    connection.query("SELECT * FROM point where customer_id = '" + req.session._id + "' ORDER BY charge_time DESC",
      function(err, result, field){
        if(err) {throw err;}
        else{
          res.render('point_charge_log', {
            title: '포인트 충전 내역',
            session: display,
            company: req.session._company_number,
            result: result
          });
        }
      });
  }
});

/* 구매자 충전신청 페이지 */
router.get('/point_charge_request', function(req, res){
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";
  // 구매자 일 때

  connection.query("SELECT * FROM customer WHERE customer_id = '" + req.session._id + "'",
    function(err, result, field){
      if(err) { throw err; }
      else{
        res.render('point_charge_request', {
          title: '포인트 충전 신청',
          session: display,
          company: req.session._company_number,
          result: result
        });
      }
    });
});

/* 구매자가 충전 신청 */
router.post('/point_charge_request', function(req, res){
  connection.query("INSERT INTO point (customer_id, charge_amount, charge_complete) VALUES ('" +
                    req.body.customer_id + "', " + req.body.charge_amount + ", 0)",
    function(err, result2, field){
      if(err) {throw err;}
      else { res.redirect('/point_charge_log'); }
  });
});

/* 관리자가 충전 */
router.post('/point_charging', function(req, res){
  var point = parseInt(req.body.charge_amount);

  connection.query("Select * FROM customer WHERE customer_id='" + req.body.customer_id + "'",
  function(err, result1, field){
    if(err) {throw err;}
    else {
      point = point + result1[0].customer_money;
      connection.query("UPDATE customer SET customer_money=" + point +" where customer_id='" + req.body.customer_id +"'",
    function(err, result2, field){
      if(err) {throw err;}
      else { 
        connection.query("UPDATE point SET charge_complete=1, charge_complete_time=NOW()" + 
                         " WHERE customer_id='" + req.body.customer_id + "' and charge_no=" + req.body.charge_no + 
                         " and charge_amount=" + req.body.charge_amount,
          function(err, result3, field){
            if(err) {throw err;}
            else{ res.redirect('/point_charge_log'); }
          });
        }
      });
    }
  });
});

/////////////////////////////////////////////////////////////////////////////////////////
//                                 CASH WITHDRAWAL SECTION                             //
/////////////////////////////////////////////////////////////////////////////////////////
/* 판매자 / 관리자 인출 로그 페이지 */
router.get('/cash_withdrawal_log', function(req, res){
  console.log('cash withdrawal log load...');

  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  if(req.session._id == "admin"){   // 관리자 일 때
    connection.query("SELECT * FROM withdraw order by withdraw_time DESC",
    function(err, result, field){
      if(err) {throw err;}
      else {
        res.render('cash_withdrawal_log', {
          title: '관리자 현금 인출 관리',
          session: display,
          company: req.session._company_number,
          result: result
        });
      }
    });
  }
  else {          // 판매자 일 때
    connection.query("SELECT * FROM withdraw where seller_id = '" + req.session._id + "' ORDER BY withdraw_time DESC",
      function(err, result, field){
        if(err) {throw err;}
        else{
          res.render('cash_withdrawal_log', {
            title: '현금 인출 내역',
            session: display,
            company: req.session._company_number,
            result: result
          });
        }
      });
  }
});

/* 판매자 인출신청 페이지 */
router.get('/cash_withdrawal_request', function(req, res){
  var display = [];
  if (req.session._id) display = req.session._id + "님, 안녕하세요!";
  else display = "계정정보 관리메뉴";

  connection.query("SELECT * FROM seller WHERE seller_id = '" + req.session._id + "'",
    function(err, result, field){
      if(err) { throw err; }
      else{
        res.render('cash_withdrawal_request', {
          title: '현금 인출 신청',
          session: display,
          company: req.session._company_number,
          result: result
        });
      }
    });
});

/* 판매가 인출 신청 */
router.post('/cash_withdrawal_request', function(req, res){
  if(parseInt(req.body.withdraw_amount) < 10){
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write("<script>");
    res.write("alert('10원 미만은 출금 신청이 불가능합니다.'); location.href=history.back();");
    res.write("</script>");
  }
  else {
  connection.query("SELECT * FROM seller WHERE seller_id='" + req.body.seller_id + "'",
    function(err, result1, field){
      if(err) {throw err;}
      else if (result1[0].seller_money < parseInt(req.body.withdraw_amount)){
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write("<script>");
        res.write("alert('소지한 금액보다 큰 금액은 신청할 수 없습니다.'); location.href=history.back();");
        res.write("</script>");
      }
      else {
        connection.query("INSERT INTO withdraw (seller_id, withdraw_amount, withdraw_complete) VALUES ('" +
                    req.body.seller_id + "', " + req.body.withdraw_amount + ", 0)",
    function(err, result2, field){
      if(err) {throw err;}
      else { 
        res.redirect('/cash_withdrawal_log');
      }
  });
      }
    }
  );
  }
});

/* 관리자가 인출 */
router.post('/cash_withdrawaling', function(req, res){
  var point = parseInt(req.body.withdraw_amount);

  connection.query("Select * FROM seller WHERE seller_id='" + req.body.seller_id + "'",
  function(err, result1, field){
    if(err) {throw err;}
    else {
      point = result1[0].seller_money - point;
      connection.query("UPDATE seller SET seller_money=" + point +" where seller_id='" + req.body.seller_id +"'",
    function(err, result2, field){
      if(err) {throw err;}
      else { 
        connection.query("UPDATE withdraw SET withdraw_complete=1, withdraw_complete_time=NOW()" + 
                         " WHERE seller_id='" + req.body.seller_id + "' and withdraw_no=" + req.body.withdraw_no + 
                         " and withdraw_amount=" + req.body.withdraw_amount,
          function(err, result3, field){
            if(err) {throw err;}
            else{ res.redirect('/cash_withdrawal_log'); }
          });
        }
      });
    }
  });
});
module.exports = router;