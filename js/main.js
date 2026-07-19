(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 992) {
        $(".navbar .dropdown")
          .on("mouseover", function () {
            $(".dropdown-toggle", this).trigger("click");
          })
          .on("mouseout", function () {
            $(".dropdown-toggle", this).trigger("click").blur();
          });
      } else {
        $(".navbar .dropdown").off("mouseover").off("mouseout");
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });

  // Preloader: some assim que a pagina termina de carregar.
  // Antes havia um setTimeout fixo de 3s, que segurava o site mesmo quando
  // ele ja estava pronto — 3 segundos de espera artificial para todo visitante.
  $(window).on("load", function () {
    $("#preloader").fadeOut("slow", function () {
      $(this).remove();
    });
  });

  // Rede ruim ou asset travado nao pode prender o usuario na tela de loading.
  setTimeout(function () {
    $("#preloader").fadeOut("slow", function () {
      $(this).remove();
    });
  }, 8000);

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Date and time picker — so inicializa se a pagina tiver os campos.
  if ($.fn.datetimepicker) {
    if ($(".date").length) $(".date").datetimepicker({ format: "L" });
    if ($(".time").length) $(".time").datetimepicker({ format: "LT" });
  }

  // Testimonials carousel
  $(".testimonial-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    margin: 30,
    dots: true,
    loop: true,
    center: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
    },
  });
})(jQuery);
