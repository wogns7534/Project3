(function($) {
  "use strict"

  // NAVIGATION
  var responsiveNav = $('#responsive-nav'),
    catToggle = $('#responsive-nav .category-nav .category-header'),
    catList = $('#responsive-nav .category-nav .category-list'),
    menuToggle = $('#responsive-nav .menu-nav .menu-header'),
    menuList = $('#responsive-nav .menu-nav .menu-list');

  catToggle.on('click', function() {
    menuList.removeClass('open');
    catList.toggleClass('open');
  });

  menuToggle.on('click', function() {
    catList.removeClass('open');
    menuList.toggleClass('open');
  });

  $(document).click(function(event) {
    if (!$(event.target).closest(responsiveNav).length) {
      if (responsiveNav.hasClass('open')) {
        responsiveNav.removeClass('open');
        $('#navigation').removeClass('shadow');
      } else {
        if ($(event.target).closest('.nav-toggle > button').length) {
          if (!menuList.hasClass('open') && !catList.hasClass('open')) {
            menuList.addClass('open');
          }
          $('#navigation').addClass('shadow');
          responsiveNav.addClass('open');
        }
      }
    }
  });

  // LOGIN CUSTOMER <-> SELLER BUTTON
  $(document).on('click', '#login_seller_btn', function(){
    $.ajax({
      type: 'get',
      url: '/login_seller',
      dataType: 'html',
      success: function(data){
        $("#login_tab").html(data);
      }
    });
  });
  $(document).on('click', '#login_customer_btn', function(){
    $.ajax({
      type: 'get',
      url: '/login_customer',
      dataType: 'html',
      success: function(data){
        $("#login_tab").html(data);
      }
    });
  });

  // LOGIN CHECKSUM CUSTOMER
  $(document).on('click', "#checksum_customer", function(){
      if($("#id").val() == ""){
          alert("아이디를 꼭 입력하세요");
          $("#id").focus();
          return;
      }
      if($("#password").val() == ""){
          alert("비밀번호를 꼭 입력하세요");
          $("#password").focus();
          return;
      }

      $.ajax({
        url: "/checksum_customer",
        dataType: "json",
        type: "POST",
        data:$('#login_customer').serialize(),

        success: function(data) {
            if(data.message == "password"){
              alert("비밀번호가 일치하지 않습니다.");
              return;
            }
            if(data.message == "failed"){
              alert("계정정보가 존재하지 않습니다.");
              return;
            }
            if(data.message == "success"){
              alert("환영합니다, " + $("#id").val() + "님!");
              location.href="/index";
            }

        },
        error: function(request, status, error) {
            alert(request.status + "  /  " + error);
        }
      });
    });
  // LOGIN CHECKSUM SELLER
  $(document).on('click', "#checksum_seller", function(){
    if($("#id").val() == ""){
        alert("아이디를 꼭 입력하세요");
        $("#id").focus();
        return;
    }
    if($("#password").val() == ""){
        alert("비밀번호를 꼭 입력하세요");
        $("#password").focus();
        return;
    }

    $.ajax({
      url: "/checksum_seller",
      dataType: "json",
      type: "POST",
      data:$('#login_seller').serialize(),

      success: function(data) {
          if(data.message == "password"){
            alert("비밀번호가 일치하지 않습니다.");
            return;
          }
          if(data.message == "failed"){
            alert("계정정보가 존재하지 않습니다.");
            return;
          }
          if(data.message == "success"){
            alert("환영합니다, " + $("#id").val() + "님!");
            location.href="/index";
          }

      },
      error: function(request, status, error) {
          alert(request.status + "  /  " + error);
      }
    });
  });


  // HOME SLICK
  $('#home-slick').slick({
    autoplay: true,
    infinite: true,
    speed: 300,
    arrows: true,
  });

  // PRODUCTS SLICK
  $('#product-slick-1').slick({
    slidesToShow: 3,
    slidesToScroll: 2,
    autoplay: true,
    infinite: true,
    speed: 300,
    dots: true,
    arrows: false,
    appendDots: '.product-slick-dots-1',
    responsive: [{
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          dots: false,
          arrows: true,
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
    ]
  });

  $('#product-slick-2').slick({
    slidesToShow: 3,
    slidesToScroll: 2,
    autoplay: true,
    infinite: true,
    speed: 300,
    dots: true,
    arrows: false,
    appendDots: '.product-slick-dots-2',
    responsive: [{
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          dots: false,
          arrows: true,
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
    ]
  });

  // PRODUCT DETAILS SLICK
  $('#product-main-view').slick({
    infinite: true,
    speed: 300,
    dots: false,
    arrows: true,
    fade: true,
    asNavFor: '#product-view',
  });

  $('#product-view').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    centerMode: true,
    focusOnSelect: true,
    asNavFor: '#product-main-view',
  });

  // PRODUCT ZOOM
  $('#product-main-view .product-view').zoom();

  // PRICE SLIDER
  var slider = document.getElementById('price-slider');
  if (slider) {
    noUiSlider.create(slider, {
      start: [0, 500],
      connect: true,
      tooltips: [true, true],
      format: {
        to: function(value) {
          return parseInt(value) + ' 만원';
        },
        from: function(value) {
          return value
        }
      },
      range: {
        'min': 0,
        'max': 500
      }
    });
  }
})(jQuery);
