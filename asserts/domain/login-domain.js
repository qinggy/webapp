$(function () {
  'use strict';

  $(document).on("pageInit", "#login-page", function (e, id, page) {
    $(page).on("click", "#login-btn", function (e) {
      //should write the login logic at here

      window.location.href = 'focus/index.html';
    });
  });

  $.init();
});