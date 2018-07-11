$(function () {
  'use strict';

  var reportEnum = {
    'bz': 'icon-bz',
    'fgp': 'icon-fgp',
    'hb': 'icon-hb',
    'lhs': 'icon-lhs',
    'nbb': 'icon-year-month',
    'rcb': 'icon-rcb',
    'rkb': 'icon-rksjhw',
    'sjd': 'icon-sjdcb',
    'tb': 'icon-tb',
    'ybb': 'icon-month-day'
  };

  var getReportType = function (type) {
    return reportEnum[type];
  };


  $(document).on("pageInit", "#page-report", function (e, id, page) {
    esdpec.framework.core.getJsonResult("reportmodule/list1", function (response) {
      var data = {
        reportList: []
      };
      var reportHtml = $jQuery('#report-no-content-template').html();
      if (response.IsSuccess && response.Content.length > 0) {
        data.reportList = response.Content;
        $jQuery.each(data.reportList, function (index, item) {
          item.ReportType = getReportType(item.ReportType);
        });
        reportHtml = template('report-list-template', data);
        $jQuery('#report-list-container').removeClass('report-no-margin').html(reportHtml);
      } else {
        $jQuery('#report-list-container').addClass('report-no-margin').html(reportHtml);
      }
    });

  });

  $.init();
});