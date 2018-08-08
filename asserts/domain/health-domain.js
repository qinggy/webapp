$(function () {
  'use strict';
  let lastclicktime = null;
  let healthType = {
    overRun: 0,
    communicate: 1
  };
  let dataTypeEnum = {
    Min: 0,
    Hour: 1,
    Day: 2,
    Week: 3,
    Month: 4,
    Year: 5
  };
  let chooseTypeEnum = {
    area: 0,
    meter: 1
  };
  let energyEnum = {
    WAT001: '水',
    ELE001: '电',
    GAS001: '气',
    COA001: '煤',
    COL001: '冷量',
    OTH: '其他',
    PEO: '人数',
    ARE: '面积',
    Production: '产能',
    GDP: '产值',
    TheoreticalCollection: '理论采集量',
    ActualCollection: '实际采集量'
  };
  let globalSTime = new Date().format('yyyy-MM-dd 00:00:01'),
    globalETime = new Date().format('yyyy-MM-dd 23:59:59'),
    globalDataType = dataTypeEnum.Hour,
    chooseType = chooseTypeEnum.area,
    activeHealthType = healthType.overRun,
    chooseId = '',
    defaultUri = '',
    paraChart;
  let formatNumber = n => n < 10 ? "0" + n : n;
  let topNode = () => {
    let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
    return _.head(meterTree, a => a.parent === '#');
  };
  let getChooseId = () => _.isEqual(chooseId, '') ? topNode().id : chooseId;
  let getUrlPara = (paraName) => `${paraName}=${getChooseId()}&healthtype=${activeHealthType}&sTime=${globalSTime}&eTime=${globalETime}`;
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
    if (chooseType === chooseTypeEnum.area)
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
    else {
      $('#alart-container').addClass('hidden');
      $('#offline-container').addClass('hidden');
      $('#detail-container').removeClass('hidden');
    }
  };
  let changePageTitle = () => {
    if (activeHealthType === healthType.overRun) {
      if (chooseType === chooseTypeEnum.area) $('#page-title').text('区域超限仪表');
      else $('#page-title').text('仪表超限详情');
    } else {
      if (chooseType === chooseTypeEnum.area) $('#page-title').text('区域通讯详情');
      else $('#page-title').text('仪表通讯详情');
    }
    let subscribe = sessionStorage.getItem('current_health');
    if (subscribe) {
      let subscribeObj = JSON.parse(subscribe);
      if (subscribeObj.id !== '') {
        $('#subscribe').text('取消关注');
        return;
      }
    }
    $('#subscribe').text('关注');
  };
  let renderMeterInfo = (data) => {
    let healthInfoHtml = '<table class="infoTable">';
    if (chooseType === chooseTypeEnum.area) {
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
    } else {
      switch (activeHealthType) {
        case healthType.overRun:
          healthInfoHtml += `<tr><td style="width: 4rem">采集条数:</td><td><span class="info-data">${data['total_count']}</span>&nbsp;个</td>`;
          healthInfoHtml += `<td style="width: 4rem">正常条数:</td><td><span class="info-data">${data['overrun_normal']}</span>&nbsp;个</td></tr>`;
          healthInfoHtml += `<tr><td style="width: 4rem">超限条数:</td><td><span class="info-data">${data['overrun_count']}</span>&nbsp;个</td></tr></table>`;
          switchInfo(healthType.overRun);
          break;
        case healthType.communicate:
          healthInfoHtml += `<tr><td style="width: 4rem">总条数:</td><td><span class="info-data">${data['total_count']}</span>&nbsp;条</td>`;
          healthInfoHtml += `<td style="width: 4rem">正常条数:</td><td><span class="info-data">${data['interrupt_normal']}</span>&nbsp;条</td></tr>`;
          healthInfoHtml += `<tr><td style="width: 4rem">中断条数:</td><td><span class="info-data">${data['interrupt_count']}</span>&nbsp;条</td></tr></table>`;
          switchInfo(healthType.communicate);
          break;
      }
    }
    $('#health-info').html(healthInfoHtml);
  };
  let renderTableList = (type, data) => {
    let alertMeterHtml = '';
    _.forEach(data, a => {
      if (a.type === 1) a.ifShowMore = 'icon-more';
    });
    if (chooseType === chooseTypeEnum.area) {
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
    } else {
      switch (type) {
        case healthType.overRun:
        case healthType.communicate:
          let parameterData = {
            parameterList: data
          };
          alertMeterHtml = template('meter-info-template', parameterData);
          $('#meter-info-container').html(alertMeterHtml);
          break;
      }
    }
  };
  let getSeries = (data, xAxis) => {
    let option = {};
    option.type = 'line';
    option.data = _.map(xAxis, a => {
      var valueItem = _.find(data.now_data_list, b => b.date === a);
      return !!valueItem ? valueItem.val : 0;
    });
    option.markLine = {
      itemStyle: {
        normal: {
          borderWidth: 1,
          lineStyle: {
            type: 'dash',
            color: '#c23531',
            width: 2,
          }
        }
      },
      data: []
    };
    let rule = data.rule;
    if (rule != null) {
      if (rule.LowerLimit != null) {
        option.markLine.data.push({
          name: 'LowerLimit',
          label: {
            formatter: '下线报警(' + rule.LowerLimit + ')',
            textStyle: {
              fontSize: 12,
            },
            position: 'middle'
          },
          yAxis: rule.LowerLimit
        });
        if (rule.LowerWave != null) {
          let waveValue = rule.LowerLimit + rule.LowerWave;
          option.markLine.data.push({
            name: 'LowerWave',
            label: {
              formatter: '下线预警(' + waveValue + ')',
              textStyle: {
                fontSize: 12,
              },
              position: 'middle'
            },
            yAxis: waveValue
          });
        }
      }
      if (rule.UpperLimit != null) {
        option.markLine.data.push({
          name: 'UpperLimit',
          label: {
            formatter: '上线报警(' + rule.UpperLimit + ')',
            textStyle: {
              fontSize: 12,
            },
            position: 'middle'
          },
          yAxis: rule.UpperLimit
        });
        if (rule.UpperWave != null) {
          let waveValue = rule.UpperLimit - rule.UpperWave;
          option.markLine.data.push({
            name: 'LowerWave',
            label: {
              formatter: '上线预警(' + waveValue + ')',
              textStyle: {
                fontSize: 12,
              },
              position: 'middle'
            },
            yAxis: waveValue
          });
        }
      }
    }
    return option;
  };
  let generateChart = function (chartDom, data, showPie = false) {
    paraChart = echarts.init(chartDom, e_macarons);
    let option = {
      tooltip: {
        trigger: 'axis'
      },
      toolbox: {
        show: true,
        x: 10,
        y: 31,
        orient: 'vertical',
        feature: {
          magicType: {
            show: true,
            icon: {
              line: "image://../../asserts/img/gz/line.png",
              bar: "image://../../asserts/img/gz/bar.png",
            },
            type: ['line', 'bar']
          }
        }
      },
      calculable: true,
      dataZoom: {
        show: true,
        realtime: true,
        start: 0,
        end: 100
      },
      xAxis: [{
        type: 'category',
        data: data.xAxisData,
        axisTick: {
          alignWithLabel: true
        }
      }],
      yAxis: [{
        type: 'value',
        position: 'right',
        axisLabel: {
          formatter: '{value} '
        }
      }],
      series: data.series
    };
    paraChart.setOption(option, true);
  };
  let renderChartAndRule = (data, nodeId, unit) => {
    if ((data.now_data_list === null || data.now_data_list.length <= 0) && paraChart) paraChart.clear();
    let chartData = {
      xAxisData: {},
      series: []
    };
    if ($('chart_' + nodeId).length <= 0)
      $jQuery('#parameterDetail_' + nodeId).append("<div class='unit'>" + unit + "</div><div class='parameter-charts' id='chart_" + nodeId + "'></div>");
    chartData.xAxisData = _.map(data.now_data_list, a => a.date);
    chartData.series = [getSeries(data, chartData.xAxisData)];
    generateChart(document.getElementById('chart_' + nodeId), chartData);
  };
  let bindDatePicker = function () {
    $("#datePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'd');
  };
  let bindSubscribe = _ => {
    let subscribeHealth = sessionStorage.getItem('current_health');
    if (subscribeHealth) {
      let subscribeObj = JSON.parse(subscribeHealth)
      if (subscribeObj.id !== '') {
        $('#subscribe').text('取消关注');
        return;
      }
    }
    $('#subscribe').text('关注');
  };
  let getMeterCommucateData = (nodeId) => {
    let node = $('#showMeterInfo_' + nodeId);
    let nodeInnerHtml = node.html();
    if (_.isEqual(nodeInnerHtml, '')) {
      let urlPara = `meterId=${nodeId}&sTime=${globalSTime}&eTime=${globalETime}`;
      esdpec.framework.core.getJsonResult('health/getareameternetworkhealth?' + urlPara, function (response) {
        if (response.IsSuccess && response.Content) {
          let meterInfoList = [{
            title: '中断次数',
            value: response.Content.interrupt_count + '次'
          }, {
            title: '仪表型号',
            value: response.Content.meter_modelname
          }, {
            title: '采集器',
            value: response.Content.collector_name
          }, {
            title: '串口',
            value: response.Content.port_name
          }, {
            title: '位置',
            value: response.Content.address
          }];
          let data = {
            meterInfoList: meterInfoList
          };
          let meterInfoHtml = template('communicate-meter-detail-template', data);
          $('#showMeterInfo_' + nodeId).html(meterInfoHtml);
        }
      });
    }
    if (node.attr('data-toggle') === 'open') {
      $jQuery('#showMeterInfo_' + nodeId).attr('data-toggle', 'close').slideUp(300);
    } else {
      $jQuery('#showMeterInfo_' + nodeId).attr('data-toggle', 'open').slideDown(300);
    }
  };
  let getMeterOverRunData = (nodeId) => {
    if (activeHealthType === healthType.overRun) {
      let urlPara = `meterId=${getChooseId()}&healthtype=${activeHealthType}&sTime=${globalSTime}&eTime=${globalETime}`;
      esdpec.framework.core.getJsonResult('health/getmeterhealth?' + urlPara, function (response) {
        if (response.IsSuccess && response.Content) {
          let rtnContent = response.Content;
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          $('#watch-name').text(_.find(meterTree, a => a.id === chooseId).text);
          let score = rtnContent.score ? parseFloat((rtnContent.score / 100.0).toFixed(2)) : 0;
          cycleloader('#health-detail-cycle', 160, 160, score);
          renderMeterInfo(rtnContent);
          renderTableList(activeHealthType, rtnContent.mfid_list);
        }
      });
    } else if (chooseType === chooseTypeEnum.area) getMeterCommucateData(nodeId);
    else {
      let urlPara = `meterId=${getChooseId()}&healthtype=${activeHealthType}&sTime=${globalSTime}&eTime=${globalETime}`;
      esdpec.framework.core.getJsonResult('health/getmeterhealth?' + urlPara, function (response) {
        if (response.IsSuccess && response.Content) {
          console.log(response.Content);
          let rtnContent = response.Content;
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          $('#watch-name').text(_.find(meterTree, a => a.id === chooseId).text);
          let score = rtnContent.score ? parseFloat((rtnContent.score / 100.0).toFixed(2)) : 0;
          cycleloader('#health-detail-cycle', 160, 160, score);
          renderMeterInfo(rtnContent);
          renderTableList(activeHealthType, rtnContent.mfid_list);
        }
      });
    }
  };
  let getChooseObjHealthData = function () {
    if (chooseType === chooseTypeEnum.area) {
      let urlPara = getUrlPara('areaId');
      esdpec.framework.core.getJsonResult('health/getareahealth?' + urlPara, function (response) {
        if (response.IsSuccess && response.Content) {
          let rtnContent = response.Content;
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          $('#watch-name').text(_.find(meterTree, a => a.id === chooseId).text);
          let score = rtnContent.score ? parseFloat((rtnContent.score / 100.0).toFixed(2)) : 0;
          cycleloader('#health-detail-cycle', 160, 160, score);
          renderMeterInfo(rtnContent);
          renderTableList(activeHealthType, rtnContent.list);
        }
      });
    } else getMeterOverRunData();
  };
  $('.health-more a').on('click', function (e) {
    let currentDom = $(e.currentTarget);
    let type = currentDom.attr('data-type');
    activeHealthType = type === '0' ? healthType.overRun : healthType.communicate;
    $('.healthType div').removeClass('active');
    $(".healthType div[data-type= '" + type + "']").addClass('active');
    sessionStorage.setItem('current_health', '');
    $.router.load('#page-health-detail');
  });
  $('.healthType div').on('click', function (e) {
    $('.healthType div').removeClass('active');
    $(e.currentTarget).addClass('active');
    activeHealthType = parseInt($(e.currentTarget).attr('data-type'));
    changePageTitle();
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
    $('#meterListContainer').html(meterHtml);
    $('.meter-list .meter-item').on('click', function (e) {
      e.stopPropagation();
      let nodeId = $(e.currentTarget).attr('data-id');
      let meterTree = sessionStorage.getItem('meter_tree');
      let meterNodes = JSON.parse(meterTree);
      let children = _.filter(meterNodes, a => a.parent === nodeId);
      if (children.length > 0) {
        renderMeterTree(children, nodeId, 'forward');
        sessionStorage.setItem('current_health', '');
        chooseId = nodeId;
        chooseType = chooseTypeEnum.area;
        changePageTitle();
        getChooseObjHealthData();
      } else {
        let node = _.find(meterNodes, a => a.id === nodeId);
        if (node.modeltype === 'vmeter' || node.modeltype === 'meter') {
          sessionStorage.setItem('current_health', '');
          chooseId = nodeId;
          chooseType = chooseTypeEnum.meter;
          changePageTitle();
          getChooseObjHealthData();
          $('#close-panel').click();
        }
      }
    });
    $('#meter-tree-panel').on('click', '#backParent', function (e) {
      e.stopPropagation();
      if (!operateBefore()) return;
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
  };
  let initDataAndHealthType = function () {
    changePageTitle();
    $('.healthType div').removeClass('active');
    if (activeHealthType === healthType.overRun) $('.healthType div.health-overrun').addClass('active');
    else $('.healthType div.health-communicate').addClass('active');
    toggleActive();
    if (globalDataType === dataTypeEnum.Day) $('#showWeek').addClass('active');
    else $('#showDay').addClass('active');
  };
  let operateMeterTreeAjaxResult = function (response) {
    if (response.IsSuccess && response.Content.length > 0) {
      let meterList = response.Content;
      sessionStorage.setItem('meter_tree', JSON.stringify(meterList));
      sessionStorage.setItem('current_health', '');
      renderMeterTree(meterList, '#', 'forward');
      chooseId = topNode().id;
      getChooseObjHealthData();
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
      let subscribe = sessionStorage.getItem('current_health');
      if (subscribe) {
        let subscribeObj = JSON.parse(subscribe);
        chooseId = subscribeObj.activeId;
        chooseType = subscribeObj.query_type;
        activeHealthType = subscribeObj.date_type;
        globalDataType = subscribeObj.data_type;
        globalSTime = subscribeObj.stime;
        globalETime = subscribeObj.etime;
        initDataAndHealthType();
      } else chooseId = topNode().id;
      getChooseObjHealthData();
    }
  };
  let getHealthTotalData = function () {
    esdpec.framework.core.getJsonResult('health/getlist', function (response) {
      if (response.IsSuccess && response.Content) {
        $('#companyName').text(response.Content.company_name);
        let overrunScore = _.isFinite(response.Content.overrun_score) ? response.Content.overrun_score / 100 : 0;
        let networkScore = _.isFinite(response.Content.network_score) ? response.Content.network_score / 100 : 0;
        cycleloader('#health-cycle', 160, 160, overrunScore);
        cycleloader('#communication-cycle', 160, 160, networkScore);
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
    globalDataType = dataTypeEnum.Hour;
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
    globalDataType = dataTypeEnum.Hour;
    ifShowSearch(false);
    globalSTime = new Date().format('yyyy-MM-dd 00:00:01');
    globalETime = new Date().format('yyyy-MM-dd 23:59:59');
    getChooseObjHealthData();
  });
  $('#showWeek').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showWeek').addClass('active');
    globalDataType = dataTypeEnum.Day;
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
  $('.list-block').on('click', '.parameterList li', (e) => {
    e.stopPropagation();
    let node = $(e.currentTarget);
    let nodeType = node.attr('data-type');
    let nodeId = node.attr('data-id');
    let unit = node.attr('data-unit');
    let chartNode = $('#parameterDetail_' + nodeId);
    let nodeInnerHtml = chartNode.html();
    if (_.isEqual(nodeInnerHtml, '')) {
      let uri = `meterId=${chooseId}&mfid=${nodeId}&type=${nodeType}&healthtype=${activeHealthType}
      &dateType=${globalDataType}&sTime=${globalSTime}&eTime=${globalETime}`;
      esdpec.framework.core.getJsonResult('health/getmeterparainfohealth?' + uri, (response) => {
        if (response.IsSuccess && response.Content) {
          console.log(response.Content);
          if (activeHealthType === healthType.communicate) unit = '条';
          renderChartAndRule(response.Content, nodeId, unit);
        }
      });
    }
    if (chartNode.attr('data-toggle') === 'open') {
      $jQuery('#parameterDetail_' + nodeId).attr('data-toggle', 'close').slideUp(300);
    } else {
      $jQuery('#parameterDetail_' + nodeId).attr('data-toggle', 'open').slideDown(300);
    }
  });
  $('.list-block').on('click', '.list li', function (e) {
    e.stopPropagation();
    let node = $(e.currentTarget);
    let nodeType = node.attr('data-type');
    if (nodeType === '0') {
      if (activeHealthType === healthType.overRun) {
        sessionStorage.setItem('current_health', '');
        chooseId = node.attr('data-id');
        chooseType = chooseTypeEnum.meter;
        changePageTitle();
        getMeterOverRunData();
      } else {
        getMeterOverRunData(node.attr('data-id'));
      }
    } else {
      let nodeId = node.attr('data-id');
      let childrenNode = $('#showChildren_' + nodeId);
      let fixedHtml = childrenNode.html();
      if (_.isEqual(fixedHtml, '')) {
        let urlPara = `areaId=${nodeId}&healthtype=${activeHealthType}&sTime=${globalSTime}&eTime=${globalETime}`;
        esdpec.framework.core.getJsonResult('health/getareanodechildhealth?' + urlPara, function (response) {
          if (response.IsSuccess) {
            let alertData = {
              alertMeterList: response.Content
            };
            let alertDataHtml = template('sub-data-template', alertData);
            $('#showChildren_' + nodeId).html(alertDataHtml);
          }
        });
      }
      if (childrenNode.attr('data-toggle') === 'open') {
        $jQuery('#showChildren_' + nodeId).attr('data-toggle', 'close').slideUp(300);
      } else {
        $jQuery('#showChildren_' + nodeId).attr('data-toggle', 'open').slideDown(300);
      }
    }
  });
  $(document).on('click', '#subscribe', function (e) {
    let subscribe = sessionStorage.getItem('current_health');
    if (!subscribe) {
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
      let node = _.find(meterTree, a => a.id === chooseId);
      let defaultTitle = '健康-' + node.text;
      let parentNode = _.find(meterTree, a => a.id === node.parent);
      var modal = $.modal({
        title: '设置关注对象名称',
        afterText: '<div >' +
          '<div class="">' +
          '<input type="text" value="' + defaultTitle + '" id="focusTitle" style="padding: 0.25rem;border-radius: 0.2rem;border: transparent;outline: transparent;">' +
          '</div>' +
          '</div>',
        buttons: [{
            text: '取消'
          },
          {
            text: '确定',
            bold: true,
            onClick: function () {
              let title = $('#focusTitle').val();
              if (_.isEqual(title, '')) {
                $.toast('请设置关注标题');
                return;
              }
              let para = {
                title: title,
                sId: '',
                areaId: node.parent,
                area_name: parentNode ? parentNode.text : '',
                slist: chooseId,
                unit: '',
                energy_code: node.EnergyCode,
                description: (parentNode ? parentNode.text : '') + '-' + node.text,
                stype: activeHealthType === healthType.overRun ? 4 : 3,
                date_type: activeHealthType,
                query_type: chooseType,
                data_type: globalDataType,
                stime: globalSTime,
                etime: globalETime,
                activeId: chooseId
              }
              esdpec.framework.core.doPostOperation('subscribe/subscribe', para, function (response) {
                if (response.IsSuccess) {
                  $.toast('关注成功');
                  $('#subscribe').text('取消关注');
                  sessionStorage.setItem('current_health', JSON.stringify({
                    id: response.Content
                  }));
                }
              });
            }
          },
        ]
      });
    } else {
      let subscribeObj = JSON.parse(subscribe);
      esdpec.framework.core.doDeleteOperation('subscribe/unsubscribe?id=' + subscribeObj.id, {}, function (response) {
        if (response.IsSuccess) {
          $('#subscribe').text('关注');
        }
      });
    }
  });
  $(document).on("pageInit", "#page-health", function (e, id, page) {
    getHealthTotalData();
  });
  $(document).on('pageInit', '#page-health-detail', function (e, id, page) {
    loadMeterTree(0);
    bindDatePicker();
    bindSubscribe();
    changePageTitle();
  });
  $.init();
});