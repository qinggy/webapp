$(function () {
  'use strict';

  var isEmail = function (email) {
    var regex = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
    return regex.test(email);
  };

  $(document).on("pageInit", "#login-page", function (e, id, page) {
    $(page).on("click", "#login-btn", function (e) {
      //should write the login logic at here
      var account = $jQuery('#account').val();
      var password = $jQuery('#password').val();
      if (account === '') {
        $.toast('请输入账号');
        return;
      } else if (!isEmail(account)) {
        $.toast('账号格式错误，请输入例如xxx@mail.com');
        return;
      }
      if (password === '') {
        $.toast('密码不能为空');
        return;
      }
      esdpec.framework.core.doPostOperation("Account/Login", {
        Account: account,
        Password: password
      }, function (response) {
        if (response.IsSuccess && response.Code === '00') {
          localStorage.setItem("user_token", response.Content);
          window.location.href = 'focus/index.html';
        } else {
          $.toast(response.Msg);
        }
      }, function (error) {
        $.toast(error.Msg);
      });
    });
  });

  $.init();
});