$(function () {
  'use strict';
  let lastclicktime = null;
  let healthType = {
    overRun: 0,
    communicate: 1
  };
  let chooseTypeEnum = {
    area: 0,
    meter: 1
  };
  let meterInfoMap = [{
    id: 'interrupt_count',
    name: '中断次数'
  }, {
    id: 'offline_meter',
    name: '离线数'
  }, {
    id: 'online_meter',
    name: '在线数'
  }, {
    id: 'overrun_meter',
    name: '超限数'
  }, {
    id: 'overrun_normal',
    name: '正常数'
  }, {
    id: 'total_meter',
    name: '区域总表数'
  }, {
    id: '',
    name: '采集条数'
  }, {
    id: '',
    name: '正常条数'
  }, {
    id: '',
    name: '超限条数'
  }];
  let globalChooseMeterList = [];
  let globalSTime = new Date().format('yyyy-MM-dd 00:00:01'),
    globalETime = new Date().format('yyyy-MM-dd 23:59:59'),
    chooseType = chooseTypeEnum.area,
    chooseId = '2787947a-ee0e-e711-80e8-a55521da1859';
  let activeHealthType = healthType.overRun;
  let formatNumber = n => n < 10 ? "0" + n : n;
  let getUrlPara = () => `areaId=${chooseId}&healthtype=${activeHealthType}&sTime=${globalSTime}&eTime=${globalETime}`;
  let getWeek = () => {
    let weekOfday = parseInt(moment().format('E'));
    let last_monday = moment().subtract(weekOfday - 1, 'days').format('YYYY-MM-DD 00:00:01');
    let last_sunday = moment().add(7 - weekOfday, 'days').format('YYYY-MM-DD 23:59:59');
    return {
      monday: last_monday,
      sunday: last_sunday
    };
  };
  let operateBefore = function () {
    if (lastclicktime === null)
      lastclicktime = new Date();
    else {
      let currentTime = new Date();
      if (parseInt(currentTime - lastclicktime) <= 300) {
        console.log('Frequent operation, no response!');
        return false;
      } else {
        lastclicktime = currentTime;
      }
    }
    return true;
  }
  let cycleloader = function (percentageLoader, width, height, progress) {
    let childLength = $jQuery(percentageLoader)[0].children.length;
    if (childLength <= 0) {
      $jQuery(percentageLoader).percentageLoader({
        width: width,
        height: height,
        progress: progress
      });
    } else {
      $jQuery(percentageLoader).empty();
      $jQuery(percentageLoader).percentageLoader({
        width: width,
        height: height,
        progress: progress
      });
    }
  };
  let toggleActive = function () {
    let tabs = $jQuery('.health-detail-header_tab a');
    $jQuery(tabs).each(function (index, item) {
      $jQuery(item).removeClass('active');
    });
  };
  let ifShowSearch = function (flag) {
    let container = $jQuery('#search-container');
    if (flag) {
      if ($jQuery('#showMoreBtn').attr('data-toggle') === 'open') {
        $jQuery('#search-container').slideDown(300);
        $jQuery('#showMoreBtn').addClass('active');
      } else {
        $jQuery('#search-container').slideUp(300);
        $jQuery('#showMoreBtn').removeClass('active').attr('data-toggle', 'close');
      }
    } else if ($jQuery('#showMoreBtn').attr('data-toggle') === 'open') {
      $jQuery('#search-container').slideUp(300);
      $jQuery('#showMoreBtn').removeClass('active').attr('data-toggle', 'close');
    }
  };
  let switchInfo = type => {
    switch (type) {
      case healthType.overRun:
        $('#alart-container').removeClass('hidden');
        $('#offline-container').addClass('hidden');
        break;
      case healthType.communicate:
        $('#alart-container').addClass('hidden');
        $('#offline-container').removeClass('hidden');
        break;
    }
  };
  let renderMeterInfo = (data) => {
    let healthInfoHtml = '<table class="infoTable">';
    switch (activeHealthType) {
      case healthType.overRun:
        healthInfoHtml += `<tr><td style="width: 4rem">区域总表数:</td><td><span class="info-data">${data['total_meter']}</span>&nbsp;个</td>`;
        healthInfoHtml += `<td style="width: 4rem">正常数:</td><td><span class="info-data">${data['overrun_normal']}</span>&nbsp;个</td></tr>`;
        healthInfoHtml += `<tr><td style="width: 4rem">超限数:</td><td><span class="info-data">${data['overrun_meter']}</span>&nbsp;个</td></tr></table>`;
        switchInfo(healthType.overRun);
        break;
      case healthType.communicate:
        healthInfoHtml += `<tr><td style="width: 4rem">区域总表数:</td><td><span class="info-data">${data['total_meter']}</span>&nbsp;个</td>`;
        healthInfoHtml += `<td style="width: 4rem">在线数:</td><td><span class="info-data">${data['online_meter']}</span>&nbsp;个</td></tr>`;
        healthInfoHtml += `<tr><td style="width: 4rem">离线数:</td><td><span class="info-data">${data['offline_meter']}</span>&nbsp;个</td>`;
        healthInfoHtml += `<td style="width: 4rem">中断次数:</td><td><span class="info-data">${data['interrupt_count']}</span>&nbsp;个</td></tr></table>`;
        switchInfo(healthType.communicate);
        break;
    }
    $('#health-info').html(healthInfoHtml);
  };
  let renderTableList = (type, data) => {
    let alertMeterHtml = '';
    _.forEach(data, a => {
      if (a.type === 1) a.ifShowMore = 'icon-more';
    });
    switch (type) {
      case healthType.overRun:
        let alertData = {
          alertMeterList: data
        };
        alertMeterHtml = template('alert-meter-tempalte', alertData);
        $('#alert-meter-container').html(alertMeterHtml);
        break;
      case healthType.communicate:
        let offlineData = {
          offlineMeterList: data
        };
        alertMeterHtml = template('offline-meter-template', offlineData);
        $('#offline-meter-container').html(alertMeterHtml);
        break;
    }
  };
  let bindDatePicker = function () {
    $("#datePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'd');
  };
  let getChooseObjHealthData = function () {
    let urlPara = getUrlPara();
    esdpec.framework.core.getJsonResult('health/getareahealth?' + urlPara, function (response) {
      if (response.IsSuccess && response.Content) {
        console.log(response.Content);
        let rtnContent = response.Content;
        let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
        $('#watch-name').text(_.find(meterTree, a => a.id === chooseId).text);
        let score = rtnContent.score ? parseFloat((rtnContent.score / 100.0).toFixed(2)) : 0;
        cycleloader('#health-detail-cycle', 160, 160, score);
        renderMeterInfo(rtnContent);
        renderTableList(activeHealthType, rtnContent.list);
      }
    });
  };
  let getCommunicateData = function () {

  };
  $('.health-more a').on('click', function (e) {
    let currentDom = $(e.currentTarget);
    let type = currentDom.attr('data-type');
    activeHealthType = type === '1' ? healthType.overRun : healthType.communicate;
    $.router.load('#page-health-detail');
  });
  $('.healthType div').on('click', function (e) {
    $('.healthType div').removeClass('active');
    $(e.currentTarget).addClass('active');
    activeHealthType = parseInt($(e.currentTarget).attr('data-type'));
    getChooseObjHealthData();
  });
  let renderMeterTree = function (list, parent, type) {
    if (type === 'forward') {
      let path = $jQuery('#parentId').val();
      $jQuery('#parentId').val(path + '||' + parent);
    }
    let children = _.filter(list, a => a.parent === parent);
    _.map(children, a => {
      a.baseInstrument = (a.modeltype === 'meter' || a.modeltype === 'vmeter') ? 'isBasic-instrument' : '';
    });
    let data = {
      meterList: children
    };
    let meterHtml = template('meter-list-template', data);
    $jQuery('#meterListContainer').html(meterHtml);
    $jQuery('.meter-list .meter-item').on('click', function (e) {
      let meterId = $(e.currentTarget).attr('data-id');
      let meterTree = sessionStorage.getItem('meter_tree');
      let meterNodes = JSON.parse(meterTree);
      let children = _.filter(meterNodes, a => a.parent === meterId);
      if (children.length > 0)
        renderMeterTree(children, meterId, 'forward');
      else {
        let node = _.find(meterNodes, a => a.id === meterId);
        if (node.modeltype === 'vmeter' || node.modeltype === 'meter') {
          globalChooseMeterList = [];
          node.checked = true;
          globalChooseMeterList.push(node);
          $('#close-panel').click();
        }
      }
    });
    $jQuery('#backParent').on('click', function (e) {
      backNavigate();
    });
  };
  let backNavigate = function () {
    let pathVal = $('#parentId').val();
    pathVal = pathVal.substring(2);
    let pathStack = pathVal.split('||');
    if (pathStack.length > 1) {
      let parent = pathStack[pathStack.length - 2];
      let pathVal = [];
      for (let i = 0; i <= pathStack.length - 2; i++) {
        pathVal[i] = pathStack[i];
      }
      let path = _.join(pathVal, '||');
      $('#parentId').val('||' + path);
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
      renderMeterTree(meterTree, parent, 'back');
    }
  }
  let operateMeterTreeAjaxResult = function (response) {
    if (response.IsSuccess && response.Content.length > 0) {
      let meterList = response.Content;
      sessionStorage.setItem('meter_tree', JSON.stringify(meterList));
      renderMeterTree(meterList, '#', 'forward');
    }
  };
  let loadMeterTree = function (type) {
    let meterJson = sessionStorage.getItem('meter_tree');
    if (!meterJson || !JSON.parse(sessionStorage.getItem('meter_tree'))) {
      switch (type) {
        case 0:
          esdpec.framework.core.getJsonResultSilent("common/gettree", function (response) {
            operateMeterTreeAjaxResult(response);
          });
          break;
        case 1:
          esdpec.framework.core.getJsonResult("common/gettree", function (response) {
            operateMeterTreeAjaxResult(response);
          });
          break;
      }
    } else {
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
      renderMeterTree(meterTree, '#', 'forward');
    }
  };
  let getHealthTotalData = function () {
    esdpec.framework.core.getJsonResult('health/getlist', function (response) {
      if (response.IsSuccess && response.Content) {
        console.log(response.Content);
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
  };
  $('#meter-tree-panel').on('close', function (e) {
    console.log('close panel now');
  });
  $('#searchmorebtn').on("click", function (e) {
    let time = $('#datePicker').val();
    if (time === '') {
      $.toast('请选择查询时间');
      return;
    }
    globalSTime = time + ' 00:00:01';
    globalETime = time + ' 23:59:59';
    getChooseObjHealthData();
  });
  $('#showMoreBtn').on("click", function (e) {
    if (!operateBefore()) return;
    let toggle = $jQuery('#showMoreBtn').attr('data-toggle');
    if (toggle === 'open') {
      $jQuery('#showMoreBtn').attr('data-toggle', 'close');
    } else {
      $jQuery('#showMoreBtn').attr('data-toggle', 'open');
    }
    toggleActive();
    ifShowSearch(true);
  });
  $('#showMenu').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showMenu').addClass('active');
    ifShowSearch(false);
  });
  $('#showDay').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showDay').addClass('active');
    ifShowSearch(false);
    globalSTime = new Date().format('yyyy-MM-dd 00:00:01');
    globalETime = new Date().format('yyyy-MM-dd 23:59:59');
    getChooseObjHealthData();
  });
  $('#showWeek').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showWeek').addClass('active');
    ifShowSearch(false);
    let week = getWeek();
    globalSTime = week.monday;
    globalETime = week.sunday;
    getChooseObjHealthData();
  });
  $(document).on('click', '#openpanel', function (e) {
    e.stopPropagation();
    $.allowPanelOpen = true;
    $.openPanel('#meter-tree-panel');
  });
  $(document).on('click', '#refreshCurrentNodeData', function () {
    let path = $jQuery('#parentId').val();
    let pathStack = path.split('||');
    let parentId = pathStack[pathStack.length - 1];
    if (parentId === '#')
      loadMeterTree(1);
    else
      esdpec.framework.core.getJsonResult('common/getchildtree?nodeId=' + parentId, function (response) {
        if (response.IsSuccess && response.Content.length > 0) {
          let children = response.Content;
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          let residueMeters = _.filter(meterTree, a => a.parent !== parentId);
          let newMeters = _.concat(residueMeters, children);
          meterTree = newMeters;
          sessionStorage.setItem('meter_tree', JSON.stringify(meterTree));
          renderMeterTree(newMeters, parentId, 'forward');
        }
      });
  });
  $(document).on("pageInit", "#page-health", function (e, id, page) {
    getHealthTotalData();
  });
  $(document).on('pageInit', '#page-health-detail', function (e, id, page) {
    loadMeterTree(0);
    bindDatePicker();
    getChooseObjHealthData();
    if (activeHealthType === healthType.overRun) {
      $('#page-title').text('区域超限仪表');
    } else {
      $('#page-title').text('区域通讯详情');
    }
  });
  $.init();
});