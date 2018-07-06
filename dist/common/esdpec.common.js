$.namespace('esdpec.framework.core');
//
Array.prototype.indexOf = function (val) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == val) return i;
  }
  return -1;
}
//数组添加remove方法
Array.prototype.remove = function (val) {
  var index = this.indexOf(val);
  if (index > -1) {
    this.splice(index, 1);
  }
}

esdpec.framework.core.Config = {
  APIBaseUrl: "",
  ajaxProcessingText: "加载中....",
  ajaxProcessedText: "完成"
}

esdpec.framework.core.getJsonResult = function (url, successCallBack, failureCallBack) {
  GlobalLoader.ShowLoader();
  setTimeout(function () {
    GlobalLoader.HideLoader();
  }, 5000);
  $.ajaxSetup({
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  });
  $.getJSON(url + "?_t=" + new Date().getTime())
    .success(function (data) {
      GlobalLoader.HideLoader();
      if (data.Code != undefined && data.Code != null && data.Code == 401) {
        location.href = "/";
      }//“If-Modified-Since”,”0”

      successCallBack(data);
      $("html").getNiceScroll().resize();

    })
    .error(function OnError(xhr, textStatus, err) {
      if (err == "Unauthorized") {
        location.reload();
      }
      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }

    });

};

esdpec.framework.core.getJsonResultRR = function (url, successCallBack, failureCallBack) {
  $.ajaxSetup({
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  });
  $.getJSON(url + "?_t=" + new Date().getTime())
    .success(function (data) {
      if (data.Code != undefined && data.Code != null && data.Code == 401) {
        location.href = "/";
      }//“If-Modified-Since”,”0”

      successCallBack(data);
      $("html").getNiceScroll().resize();
    })
    .error(function OnError(xhr, textStatus, err) {
      if (err == "Unauthorized") {
        location.reload();
      }
      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }

    });

};

esdpec.framework.core.getJSONData = function (url, successCallBack, failureCallBack) {

  $.ajaxSetup({
    cache: false,
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  });
  $.getJSON(this.Config.APIBaseUrl + url)

    .success(function (data) {
      successCallBack(data);
      $("html").getNiceScroll().resize();
    })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;
        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)

      };
    });
}

//Web api - Http get operation - Data fetch
esdpec.framework.core.getJSONDataBySearchParam = function (url, object, successCallBack, failureCallBack, beforeSendCallBack, onCompleteCallBack) {
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'GET',
    data: object,
    beforeSend: beforeSendCallBack == undefined ? undefined : beforeSendCallBack,
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
      onCompleteCallBack;
    }
  })
    .success(function (data) { successCallBack(data); })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });
}

// Web api - Http put operation - record update
esdpec.framework.core.doPutOperation = function (url, object, successCallBack, failureCallBack) {
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'PUT',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(object),
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  })
    .success(function (data) {
      successCallBack(data);
      $("html").getNiceScroll().resize();
    })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });
}

esdpec.framework.core.doPost = function (url, obj, success, failure) {
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    data: obj,
    statusCode: {
      200: function (data) {
        success(data);
        $("html").getNiceScroll().resize();
      }
    },
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  }).error(function OnError(xhr, textStatus, err) {

    if (failure != null) {
      var obj = jQuery.parseJSON(xhr.responseText);
      var errObj = new Object();
      errObj.Message = obj.Message;

      if (obj.ModelState != null)
        errObj.ModelState = obj.ModelState;

      errObj.status = xhr.status;
      errObj.statusText = xhr.statusText;
      failure(errObj)
    }
  });
}

// Web api - Http post operation - create record
esdpec.framework.core.doPostOperation = function (url, object, successCallBack, failureCallBack) {
  //
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify(object),
    statusCode: {
      200: function (data) {
        successCallBack(data);
        $("html").getNiceScroll().resize();
      }
    },
    beforeSend: function () {
      GlobalLoader.ShowLoader();
      setTimeout(function () {
        GlobalLoader.HideLoader();
      }, 5000);
    },
    complete: function (XMLHttpRequest, textStatus) {
      GlobalLoader.HideLoader();
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
      var unauthorize = XMLHttpRequest.getResponseHeader("authorize");
      if (unauthorize == "unauthorize") {
        location.href = "/UnAuthrize";
      }
    }

  })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });
}

// Web api - Http post operation - create record
esdpec.framework.core.doPostLoad = function (url, object, successCallBack, failureCallBack) {
  //
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: object,
    statusCode: {
      200: function (data) {
        successCallBack(data)
        $("html").getNiceScroll().resize();
      }
    },
    beforeSend: function () {
      GlobalLoader.ShowLoader();
      setTimeout(function () {
        GlobalLoader.HideLoader();
      }, 5000);
    },
    complete: function (XMLHttpRequest, textStatus) {
      GlobalLoader.HideLoader();
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
      var unauthorize = XMLHttpRequest.getResponseHeader("authorize");
      if (unauthorize == "unauthorize") {
        location.href = "/UnAuthrize";
      }
    }

  })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });
}

esdpec.framework.core.doPostOperationWithOutLoading = function (url, object, successCallBack, failureCallBack) {
  //
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify(object),
    statusCode: {
      200: function (data) {
        successCallBack(data);
        $("html").getNiceScroll().resize();
      }
    },
    beforeSend: function () {

    },
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
      var unauthorize = XMLHttpRequest.getResponseHeader("authorize");
      if (unauthorize == "unauthorize") {
        location.href = "/UnAuthrize";
      }
    }

  })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });


}

//sync
esdpec.framework.core.doPostOperationAsyncFalse = function (url, object, successCallBack, failureCallBack) {
  //
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    async: false,
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(object),
    statusCode: {
      200 /*Created*/: function (data) {
        successCallBack(data);
        $("html").getNiceScroll().resize();
      }
    },
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  })
    .error(function OnError(xhr, textStatus, err) {

      if (failureCallBack != null) {
        var obj = jQuery.parseJSON(xhr.responseText);
        var errObj = new Object();
        errObj.Message = obj.Message;

        if (obj.ModelState != null)
          errObj.ModelState = obj.ModelState;

        errObj.status = xhr.status;
        errObj.statusText = xhr.statusText;
        failureCallBack(errObj)
      }
    });
}

// Web api - Http delete operation - delete a record
esdpec.framework.core.doDeleteOperation = function (url, object, successCallBack, failureCallBack) {
  $.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'DELETE',
    data: JSON.stringify(object),
    contentType: 'application/json; charset=utf-8',
    complete: function (XMLHttpRequest, textStatus) {
      var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
      if (sessionstatus == "timeout") {
        location.href = "/";
      }
    }
  })
    .success(function (data) { successCallBack(data); })
    .fail(
      function (xhr, textStatus, err) {
        if (failureCallBack != null)
          failureCallBack(xhr, textStatus, err);
      });
}

esdpec.framework.core.Validator = function (obj, url, rules, message, successCallback) {
  $('#' + obj).validate({
    submitHandler: function (form) {
      if (obj == "loginf") //登录
      {
        console.log("kk");
        var user = {};
        user.Password = $.md5($("#password").val());
        user.EmailId = $("#emailid").val();
        $.post(url,
          user,
          function (response) {
            successCallback(response);
          });
      } else {
        $(form).ajaxSubmit({
          url: url,
          dataType: "json",
          type: "post", //('#' + obj).serialize(),
          success: function (response) {
            successCallback(response);
          }
        });
      }

    },
    focusInvalid: true,
    onfocusout: function (element) { $(element).valid(); },
    rules: rules,
    messages: message,
    errorElement: "div",
    errorClass: "error_info",
    highlight: function (element, errorClass, validClass) {
      $(element).closest('.form-control').addClass('highlight_red');
    },
    success: function (element) {
      $(element).siblings('.form-control').removeClass('highlight_red');
      $(element).siblings('.form-control').addClass('highlight_green');
      $(element).remove();

    }
  });
}

var GlobalLoader = {
  ShowLoader: function () {
    if ($('.blockUI').length == 0) {
      var common = EsdPec.Cloud.NewGeneration.lang.Common;
      $.blockUI({ message: '<img src="/Content/images/loading-spinner-grey.gif" /> ' + common.Wait + '...' });
    }
  },
  HideLoader: function () {
    $.unblockUI();
  }
}
if ($.blockUI) {
  var common = EsdPec.Cloud.NewGeneration.lang.Common;
  $(document).ajaxStart(
    $.blockUI({ message: '<img src="/Content/images/loading-spinner-grey.gif" /> ' + common.Wait + '...' })

  ).ajaxStop(
    $.unblockUI()
  );
}