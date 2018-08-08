$(function () {
  'use strict';


  $(document).on("pageInit", "#page-about", function (e, id, page) {
    $(page).on("click", ".bar-tab a", function (e) {

    });
    $(page).on('click', '.unbind-contain', function (e) {
      localStorage.removeItem('user_token');
      window.location.href = '../login.html';
    });
  });

  $.init();
});