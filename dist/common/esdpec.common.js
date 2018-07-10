$jQuery.namespace('esdpec.framework.core');
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
  APIBaseUrl: 'http://172.17.0.21/api/',
  ajaxProcessingText: "加载中....",
  ajaxProcessedText: "完成"
}

esdpec.framework.core.completeRequest = function (XMLHttpRequest, textStatus, onCompleteCallBack) {
  var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
  var unauthorize = XMLHttpRequest.getResponseHeader("authorize");
  if (sessionstatus === "timeout" || unauthorize === "unauthorize") {
    location.href = "/login.html";
  }
  if (onCompleteCallBack != null) onCompleteCallBack;
};

esdpec.framework.core.getJsonResult = function (url, successCallBack, failureCallBack) {
  $.showPreloader('Please Wait ...');;
  setTimeout(function () {
    $.hidePreloader();
  }, 5000);
  $jQuery.ajaxSetup({
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  });
  $jQuery.getJSON(this.Config.APIBaseUrl + url + "?_t=" + new Date().getTime())
    .done(function (data) {
      $.hidePreloader();
      if (data.Code != undefined && data.Code != null && data.Code == 401) {
        location.href = "/";
      }
      successCallBack(data);
      $jQuery("html").getNiceScroll().resize();
    })
    .fail(function OnError(xhr, textStatus, err) {
      if (err == "Unauthorized") {
        location.reload();
      }
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
};

esdpec.framework.core.getJsonResultRR = function (url, successCallBack, failureCallBack) {
  $jQuery.ajaxSetup({
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  });
  $jQuery.getJSON(this.Config.APIBaseUrl + url + "?_t=" + new Date().getTime())
    .done(function (data) {
      if (data.Code != undefined && data.Code != null && data.Code == 401) {
        location.href = "/";
      }
      successCallBack(data);
      $jQuery("html").getNiceScroll().resize();
    })
    .fail(function OnError(xhr, textStatus, err) {
      if (err == "Unauthorized") {
        location.reload();
      }
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
};

esdpec.framework.core.getJSONData = function (url, successCallBack, failureCallBack) {
  $jQuery.ajaxSetup({
    cache: false,
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  });
  $jQuery.getJSON(this.Config.APIBaseUrl + url)
    .done(function (data) {
      successCallBack(data);
      $jQuery("html").getNiceScroll().resize();
    })
    .fail(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      };
    });
}

//Web api - Http get operation - Data fetch
esdpec.framework.core.getJSONDataBySearchParam = function (url, object, successCallBack, failureCallBack, beforeSendCallBack, onCompleteCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'GET',
      data: object,
      beforeSend: beforeSendCallBack == undefined ? undefined : beforeSendCallBack,
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus, onCompleteCallBack);
      }
    })
    .success(function (data) {
      successCallBack(data);
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

// Web api - Http put operation - record update
esdpec.framework.core.doPutOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'PUT',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(object),
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .success(function (data) {
      successCallBack(data);
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

esdpec.framework.core.doPost = function (url, obj, success, failure) {
  $jQuery.ajax({
    url: this.Config.APIBaseUrl + url,
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    data: obj,
    statusCode: {
      200: function (data) {
        success(data);
      }
    },
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  }).error(function OnError(xhr, textStatus, err) {
    if (failure != null) {
      failure($jQuery.parseJSON(xhr.responseText));
    }
  });
}

// Web api - Http post operation - create record
esdpec.framework.core.doPostOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify(object),
    statusCode: {
      200: function (data) {
        successCallBack(data);
      }
    },
    beforeSend: function () {
      $.showPreloader('Please Wait ...');
      setTimeout(function () {
        $.hidePreloader();
      }, 5000);
    },
    complete: function (XMLHttpRequest, textStatus) {
      $.hidePreloader();
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    },
    error: function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    }
  });
}

// Web api - Http post operation - create record
esdpec.framework.core.doPostLoad = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'POST',
      contentType: 'application/json',
      dataType: "json",
      data: object,
      statusCode: {
        200: function (data) {
          successCallBack(data)
        }
      },
      beforeSend: function () {
        $.showPreloader('Please Wait ...');
        setTimeout(function () {
          $.hidePreloader();
        }, 5000);
      },
      complete: function (XMLHttpRequest, textStatus) {
        $.hidePreloader();
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

esdpec.framework.core.doPostOperationWithOutLoading = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'POST',
      contentType: 'application/json',
      dataType: "json",
      data: JSON.stringify(object),
      statusCode: {
        200: function (data) {
          successCallBack(data);
        }
      },
      beforeSend: function () {

      },
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

//sync
esdpec.framework.core.doPostOperationAsyncFalse = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      async: false,
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(object),
      statusCode: {
        200: function (data) {
          successCallBack(data);
        }
      },
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

// Web api - Http delete operation - delete a record
esdpec.framework.core.doDeleteOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'DELETE',
      data: JSON.stringify(object),
      contentType: 'application/json; charset=utf-8',
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .success(function (data) {
      successCallBack(data);
    })
    .fail(function (xhr, textStatus, err) {
      if (failureCallBack != null)
        failureCallBack(xhr, textStatus, err);
    });
}

var GlobalLoader = {
  ShowLoader: function () {
    if ($jQuery('.blockUI').length == 0) {
      var common = 'Please Wait ...';
      $jQuery.blockUI({
        message: '<img src="/asserts/img/loading.gif" /> ' + common.Wait + '...'
      });
    }
  },
  HideLoader: function () {
    $jQuery.unblockUI();
  }
}
if ($jQuery.blockUI) {
  var common = 'Please Wait ...';
  $jQuery(document).ajaxStart(
    $jQuery.blockUI({
      message: '<img src="/asserts/img/loading.gif" /> ' + common.Wait + '...'
    })
  ).ajaxStop(
    $jQuery.unblockUI()
  );
}