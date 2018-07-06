$(function () {
  'use strict';

  var cycleloader = function (percentageLoader, width, height, progress) {
    var $loader = $j(percentageLoader).percentageLoader({
      width: width,
      height: height,
      progress: progress
    });
  };

  $(document).on("pageInit", "#page-health", function (e, id, page) {
    cycleloader('#health-cycle', 160, 160, 0.9);
    cycleloader('#communication-cycle', 160, 160, 0.59);
    $(page).on("click", ".bar-tab a", function (e) {

    });

  });

  $.init();
});