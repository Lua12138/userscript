// ==UserScript==
// @name        JD_Histroy_Price
// @name:zh-CN  京东历史价格
// @namespace   https://github.com/gam2046/userscript
// @description Shown histroy price of JD
// @description:zh-CN [无广告]一目了然显示京东商城历史价格，没有其他额外功能。Chrome 64.+中测试通过，其他环境不保证可用。
// @include     /http(?:s|)://item\.(jd|yiyaojd)\.(?:[^./]+)/\d+\.html/
// @require     https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.bundle.min.js
// @updateURL   https://github.com/gam2046/userscript/raw/master/jd-histroy-price.user.js
// @supportURL  https://github.com/gam2046/userscript/issues/new
// @run-at      document-idle
// @version     5
// @grant       GM_xmlhttpRequest
// @copyright   2018+, forDream <gan2046#gmail.com>
// @author      forDream
// ==/UserScript==
(function () {
    'use strict';

    var extension = {
        isUndefined: function (obj) { return typeof (obj) == "undefined" || obj == null; },
        timestampToDateObject: function (timestamp) {
            while (timestamp < 1000000000000) {
                timestamp *= 10;
            }
            return new Date(timestamp);
        },
        timestampToDateString: function (timestamp) {
            var date = extension.timestampToDateObject(timestamp);
            var Y = date.getFullYear() + '-';
            var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
            var D = date.getDate();
            return Y + M + D;
        },
        currentGoodsId: /(\d+)\.html/.exec(window.location.href)[1],
        currentGoodsName: document.getElementsByClassName("sku-name")[0].innerText.trim(),
        sourcePriceJson: undefined,
        canvasId: "forDream_Canvas_Chart_12138",
        chart: undefined,
        chartData: undefined,
        chartColors: {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        },
        createSelectOption: function (text, value) {
            var option = document.createElement("option");
            option.innerText = text;
            option.value = value;
            return option;
        },
        xhrError: function () { console.log("XHR ERROR"); },
        doQuery: function () {
            var requestUrl = "https://browser.gwdang.com/extension?ac=price_trend&dp_id=" + extension.currentGoodsId + "-3&union=union_gwdang&version=1516933775230&from_device=default&_=" + Date.parse(new Date());
            GM_xmlhttpRequest({
                url: requestUrl,
                method: "GET",
                onload: function (details) {
                    extension.sourcePriceJson = JSON.parse(details.responseText);
                    extension.processQuery();
                    extension.injectButton();
                },
                onerror: extension.xhrError,
                onabort: extension.xhrError,
                ontimeout: extension.xhrError
            });
        },
        processQuery: function (limit) {
            if (extension.isUndefined(limit)) {
                limit = 0;
            }

            if (extension.isUndefined(extension.sourcePriceJson)) {
                console.error("Error request.");
                return;
            }

            console.log("update chart data with limit", limit);
            if (extension.isUndefined(extension.chartData)) {
                extension.chartData = {
                    labels: [],
                    datasets: [
                        {
                            label: "历史价格",
                            fill: false,
                            steppedLine: false,
                            backgroundColor: extension.chartColors.blue,
                            borderColor: extension.chartColors.blue,
                            data: []
                        }, {
                            label: "历史均价",
                            steppedLine: false,
                            backgroundColor: extension.chartColors.green,
                            borderColor: extension.chartColors.green,
                            borderDash: [5, 5],
                            fill: false,
                            data: []
                        }, {
                            label: "虚标原价",
                            steppedLine: false,
                            backgroundColor: extension.chartColors.red,
                            borderColor: extension.chartColors.red,
                            fill: false,
                            data: []
                        }
                    ]
                };
            } else {
                extension.chartData.labels = [];
                extension.chartData.datasets[0].data = [];
                extension.chartData.datasets[1].data = [];
                extension.chartData.datasets[2].data = [];
            }

            var data = extension.chartData;
            var oneDay = 1000 * 60 * 60 * 24;
            var json = extension.sourcePriceJson;
            for (var i in json.store) {
                var store = json.store[i];
                var beginTimestamp = new Date();
                if (limit >= 0) {
                    beginTimestamp = store.all_line_begin_time;
                } else {
                    beginTimestamp.setHours(0, 0, 0, 0);
                    beginTimestamp = new Date(beginTimestamp.valueOf() + limit * oneDay);
                }
                var currentTimestamp = store.all_line_begin_time;
                var lastPrice = -1;
                var sumPrice = 0;
                var dayCount = 0;
                // 历史实时价格
                for (var j in store.all_line) {
                    if (currentTimestamp >= beginTimestamp) {
                        dayCount++;
                        sumPrice += store.all_line[j];
                        if (lastPrice != store.all_line[j]) {
                            lastPrice = store.all_line[j];
                            var price = store.all_line[j];
                            data.labels.push(extension.timestampToDateString(currentTimestamp));
                            data.datasets[0].data.push(price);
                        }
                    }
                    currentTimestamp += oneDay;
                }
                // 历史均价
                var avgPrice = sumPrice / dayCount;
                data.datasets[1].data.push({
                    x: extension.timestampToDateString(beginTimestamp),
                    y: avgPrice
                });
                data.datasets[1].data.push({
                    x: data.labels[data.labels.length - 1],
                    y: avgPrice
                });
                // 虚标原价
                var officalPriceDOM = document.getElementById("page_origin_price");
                if (!extension.isUndefined(officalPriceDOM)) {
                    var officalPrice = /\d+/.exec(officalPriceDOM.innerText)[0];
                    data.datasets[2].data.push({
                        x: extension.timestampToDateString(beginTimestamp),
                        y: officalPrice
                    });
                    data.datasets[2].data.push({
                        x: data.labels[data.labels.length - 1],
                        y: officalPrice
                    });
                }
                console.log("ActiveRecord is", dayCount, "BeginTimestamp is", beginTimestamp,
                    "EndTimestamp is", store.max_stamp, "ActiveEndTimestamp is", currentTimestamp);
            }

            if (!extension.isUndefined(extension.chart)) {
                extension.chart.update();
            }
        },
        injectButton: function () {
            var button = document.createElement("select");
            button.className = "btn-special1 btn-lg";
            // button.href = "#";
            // button.onmouseenter = extension.showHistroyPannel;
            // button.onmouseleave = extension.hideHistroyPannel;
            // button.innerText = "历史价格";
            button.appendChild(extension.createSelectOption("完整历史价格", 0));
            button.appendChild(extension.createSelectOption("最近七天历史价格", -7));
            button.appendChild(extension.createSelectOption("最近一月历史价格", -30));
            button.appendChild(extension.createSelectOption("最近三月历史价格", -90));
            button.appendChild(extension.createSelectOption("最近半年历史价格", -180));
            button.dataset.currentValue = 0;

            button.onchange = function () {
                console.log("select onchage event");
                var selectedValue = button.options[button.selectedIndex].value;
                if (button.dataset.currentValue != selectedValue) {
                    console.log("select update data");
                    button.dataset.currentValue = selectedValue;
                    extension.processQuery(selectedValue);
                }
            };

            var div = document.createElement("div");
            div.style.width = "100%";

            var canvas = document.createElement("canvas");
            canvas.id = extension.canvasId;

            // canvas.style.display = "none";
            document.getElementsByClassName("choose-btns clearfix")[0].appendChild(button);
            div.appendChild(canvas);
            document.getElementsByClassName("product-intro clearfix")[0].appendChild(div);
            extension.showHistroyPannel();
        },
        showHistroyPannel: function () {
            if (extension.isUndefined(extension.chartData)) {
                console.log("There is no chart data to show, ignore");
                return;
            }

            var canvas = document.getElementById(extension.canvasId);

            if (extension.isUndefined(canvas)) {
                console.log("Unknown Error");
            } else {
                if (extension.isUndefined(extension.chart)) {
                    var context = document.getElementById(extension.canvasId).getContext("2d");
                    extension.chart = new Chart(context, {
                        responsive: true,
                        type: "line",
                        data: extension.chartData,
                        options: {
                            // animation: {},
                            title: {
                                display: true,
                                text: extension.currentGoodsName
                            },
                            hover: {
                                mode: 'nearest',
                                intersect: true
                            },
                            scales: {
                                xAxes: [{
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: "时间"
                                    }
                                }],
                                yAxes: [{
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: "价格"
                                    }
                                }]
                            }
                        }
                    });
                }
                canvas.style.display = "";
            }
        },
        hideHistroyPannel: function () {
            var canvas = document.getElementById(extension.canvasId);
            if (!extension.isUndefined(canvas)) {
                canvas.style.display = "none";
            }
        }
    };

    extension.doQuery();
})();
