$(function () {
  'use strict';

  var cycleloader = function (percentageLoader, width, height, progress) {
    var childLength = $jQuery(percentageLoader)[0].children.length;
    if (childLength <= 0)
      var $loader = $jQuery(percentageLoader).percentageLoader({
        width: width,
        height: height,
        progress: progress
      });
  };

  $(document).on("pageInit", "#page-health", function (e, id, page) {
    cycleloader('#health-cycle', 160, 160, 1.0);
    cycleloader('#communication-cycle', 160, 160, 0.19);
    $(page).on("click", ".bar-tab a", function (e) {

    });

  });

  $.init();
});