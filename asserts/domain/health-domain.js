$(function () {
  'use strict';
  let moduleEnum = {
    overRun: 1,
    communicate: 2
  };
  let globalHealthModule = moduleEnum.overRun;
  let cycleloader = function (percentageLoader, width, height, progress) {
    let childLength = $jQuery(percentageLoader)[0].children.length;
    if (childLength <= 0)
      $jQuery(percentageLoader).percentageLoader({
        width: width,
        height: height,
        progress: progress
      });
  };
  $('.health-more a').on('click', function (e) {
    let currentDom = $(e.currentTarget);
    let type = currentDom.attr('data-type');
    globalHealthModule = type === '1' ? moduleEnum.overRun : moduleEnum.communicate;
    console.log(globalHealthModule);
    $.router.load('#page-health-detail');
  });
  $(document).on("pageInit", "#page-health", function (e, id, page) {
    esdpec.framework.core.getJsonResult('health/getlist', function (response) {
      if (response.IsSuccess && response.Content) {
        $('#companyName').text(response.Content.company_name);
        cycleloader('#health-cycle', 160, 160, response.Content.overrun_score ? response.Content.overrun_score / 100 : 0);
        cycleloader('#communication-cycle', 160, 160, response.Content.network_score ? response.Content.network_score / 100 : 0);
        $('#total_meter').text(response.Content.total_meter);
        $('#overrun_normal').text(response.Content.overrun_normal);
        $('#overrun').text(response.Content.overrun_meter);
        $('#online_meter').text(response.Content.online_meter);
        $('#offline-meter').text(response.Content.offline_meter);
        $('#comm_total_meter').text(response.Content.total_meter);
      }
    });
  });
  $(document).on('pageInit', '#page-health-detail', function (e, id, page) {
    if (globalHealthModule === moduleEnum.overRun) {
      $('#page-title').text('区域超限仪表');
    } else {
      $('#page-title').text('区域通讯详情');
    }
  });
  $.init();
});