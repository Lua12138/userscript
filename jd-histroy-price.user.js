// ==UserScript==
// @name        JD_Tmall_Taobao_Histroy_Price
// @name:zh-CN  京东/天猫/淘宝历史价格
// @namespace   https://github.com/gam2046/userscript
// @description Shown histroy price of JD
// @description:zh-CN [无广告] 一目了然显示京东/天猫商城，淘宝集市历史价格，没有其他额外功能。Chrome 64.+中测试通过，其他环境不保证可用。
// @include     /http(?:s|)://(?:item\.(?:jd|yiyaojd)\.(?:[^./]+)/\d+\.html|.+)/
// @include     /http(?:s|)://(?:detail|item)\.(?:taobao|tmall)\.(?:[^./]+)/item.htm/
// @require     https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.bundle.min.js
// @updateURL   https://github.com/gam2046/userscript/raw/master/jd-histroy-price.user.js
// @supportURL  https://github.com/gam2046/userscript/issues/new
// @connect     pansy.pw
// @connect     gwdang.com
// @run-at      document-idle
// @version     15
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @copyright   2018+, forDream <gan2046#gmail.com>
// @author      forDream
// ==/UserScript==
(function () {
    class Utils {
        /**
            * 将时间戳转换为对象
            * @param timestamp 时间戳
            */
        static timestampToDateObject(timestamp) {
            while (timestamp < 1000000000000) {
                timestamp *= 10;
            }
            return new Date(timestamp);
        }

        /**
         * 将时间戳转换成时间字符串
         * @param timestamp 时间戳
         */
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
    }

    class SupportSite {
        constructor() {
            // 用于绘制图表
            this.canvas = document.createElement('canvas')
            this.injeried = false
            this.injeryButton = document.createElement('select')
            this.injeryButton.appendChild(this.createSelectOption("完整历史价格", 0));
            this.injeryButton.appendChild(this.createSelectOption("最近七天历史价格", -7));
            this.injeryButton.appendChild(this.createSelectOption("最近一月历史价格", -30));
            this.injeryButton.appendChild(this.createSelectOption("最近三月历史价格", -90));
            this.injeryButton.appendChild(this.createSelectOption("最近半年历史价格", -180));
            this.injeryButton.dataset.currentValue = 0;

            // 改变展现周期
            this.injeryButton.addEventListener('click', (event) => {
                // TODO 完成相关逻辑
            })
        }

        createSelectOption(text, value) {
            const option = document.createElement('option')
            option.innerText = text
            option.value = value
            return option
        }
        /**
         * 子类应该复写
         *
         * 返回当前的商品ID
         */
        goodsId() { throw 'UnImplementation' }

        /**
         * 子类应该复写
         *
         * 返回当前页面的商品名称
         */
        goodsName() { throw 'UnImplementation' }

        /**
         * 子类应该复写
         *
         * 返回当前类所处理的网站名称
         */
        siteName() { throw 'UnImplementation' }

        /**
         * 子类应该复写
         *
         * 返回当前页面是否由该类进行处理
         */
        isMatch() { throw 'UnImplementation' }

        toDoSomething() { console.log('Threer is nothing to do from parent') }
        /**
         * 替代 isMatch 方法
         * 需要一些额外的插装操作
         */
        isWork() {
            if (this.isMatch()) {
                this.toDoSomething()
                return true
            }
            return false
        }
        /**
         * 子类应该复写
         * 
         * 将图表元素插入到适当的位置
         */
        injeryCanvas() { throw 'UnImplementaion' }
        /**
         * 
         * 返回图表元素，返回时，此方法应当已经将相关元素插入网页中
         */
        chartCanvas() {
            if (!this.injeried) {
                this.injeryCanvas(this.canvas)
                this.injeried = true
            }
            return this.canvas
        }
    }

    /**
     * 数据源抽象
     */
    class DataSource {
        /**
         *
         * @param limit 限制显示的天数，大于等于0为不限制，负数代表限制的天数
         */
        constructor(limit) {
            this.limit = limit
            /**
             * 历史价格 仅当价格发生变化时，存在记录
             * 连续数天价格一致则不存储重复记录
             * key 为时间戳
             * value 为价格
             */
            this.price = new Map()

            this.ready = false
        }
        /**
         * 返回查询历史价格的目标地址
         * @param site 准备查询的站点信息
         */
        queryHistoryUrl(site) {
            throw 'UnImplementation'
        }

        requestOnError() {
            alert('查询历史记录错误')
        }

        requestOnAbort() {
            alert('查询历史记录被终止')
        }

        requestOnTimeout() {
            alert('查询历史记录超时')
        }

        /**
         * 数据源是否已经准备就绪
         */
        isReady() {
            return this.ready
        }

        waitForReady(timeout) {
            return new Promise(async function (resolve, reject) {
                const interval = 500
                const successFlag = -4096
                let t = timeout
                if (t < 1) {
                    t = 65536
                }

                while (t > 0) {
                    window.setTimeout(() => {
                        if (this.isReady()) {
                            t = successFlag // 直接跳出循环
                        }
                    }, interval)

                    t -= interval

                    await Utils.sleep(interval)
                }

                if (t == successFlag) {
                    resolve()
                } else {
                    reject()
                }
            }.bind(this))
        }
        /**
         * 子类复写
         *
         * 查询结果完成
         */
        // requestOnLoad(details) {
        // throw 'UnImplementation'
        // }

        request(site) {
            const requestUrl = this.queryHistoryUrl(site)
            GM_xmlhttpRequest({
                url: requestUrl,
                method: "GET",
                onload: this.requestOnLoad.bind(this),
                onerror: this.requestOnError,
                onabort: this.requestOnAbort,
                ontimeout: this.requestOnTimeout
            });
        }
    }

    class Gwdang extends DataSource {
        queryHistoryUrl(site) {
            let id = site.goodsId()
            if (site instanceof Taobao) {
            } else if (site instanceof JD) {
                id = `${id}-3`
            } else {
                super.queryHistory(site)
            }

            return `https://browser.gwdang.com/extension?ac=price_trend&dp_id=${id}&union=union_gwdang&version=1518335403103&from_device=default&_=${Date.parse(new Date())}`
        }

        requestOnLoad(details) {
            const json = JSON.parse(details.responseText);
            console.log('Gwdang Response', json)

            // 一天的毫秒数
            const oneDay = 1000 * 60 * 60 * 24
            for (let i in json.store) {
                const store = json.store[i]
                // let beginTimestamp = new Date()
                let currentTimestamp = store.all_line_begin_time
                let lastPrice = -1 // 上一天的价格
                // let sumPrice = 0 // 总计价格 用于统计均价
                // let dayCount = 0 // 总计天数

                // // 设置显示的起始时间
                // if (this.limit >= 0) {
                //     beginTimestamp = store.all_line_begin_time
                // } else {
                //     beginTimestamp.setHours(0, 0, 0, 0)
                //     beginTimestamp = new Date(beginTimestamp.valueOf() + this.limit * oneDay)
                // }

                for (let j in store.all_line) {
                    if (lastPrice != store.all_line[j]) {
                        lastPrice = store.all_line[j]
                        // 保存历史价格
                        this.price.set(currentTimestamp, store.all_line[j])
                    }
                    // 时间计数器+1
                    currentTimestamp += oneDay
                }
            }

            console.log('Gwdang History', this.price)

            // 标记任务已完成
            this.ready = true
        }
    }
    class Taobao extends SupportSite {
        isMatch() { return /(taobao|tmall)\.com/.test(window.location.host) }
        siteName() { return 'taobao' }
        goodsId() { return /(?:&|\?)id=(\d+)/.exec(window.location.href)[1] }
        goodsName() { return document.title.replace("-tmall.com天猫", "").replace("-淘宝网", "") }
        injeryCanvas() {
            const div = document.createElement('div')
            div.style.width = '100%'
            div.appendChild(this.canvas)

            this.injeryButton.style = 'width: 180px;height:38px;color: #FFF;border-color: #F40;background: #F40;'
            document.getElementById("detail").appendChild(div)
            // document.getElementsByClassName("tb-action")[0].appendChild(this.injeryButton)
        }
    }

    class JD extends SupportSite {
        itemRegexp() { return /item\.(?:jd|yiyaojd)\.(?:[^./]+)\/(\d+)\.html/ }
        isMatch() { return this.itemRegexp().test(window.location.href) }
        siteName() { return 'jd' }
        goodsId() { return /(\d+)\.html/.exec(window.location.href)[1] }
        goodsName() { return document.getElementsByClassName("sku-name")[0].innerText.trim() }
        isWork() {
            if (/(jd|yiyaojd)\.(com|hk)/.test(window.location.host)) {
                window.setTimeout(() => { this.toDoSomething() }, 3000)
                this.amIJump()
                return this.isMatch()
            }
            return false
        }
        processRemote(json, link, sku) {
            if (link.onclick != null || link.href.indexOf('#') != -1) {
                return true
            }
            if (json.code == 200 &&
                json.msg.responseCode == 200) {
                link.href = json.msg.longLink
                link.rel = 'noreferrer noopener'
                return true
            }

            return false
        }
        amIJump() {
            const buy = document.getElementsByClassName('gobuy')
            if (buy.length == 1) {
                window.location.href = buy[0].getElementsByTagName('a')[0].href
                return
            }
        }
        toDoSomething() {
            const regexp = /item\.jd\.(?:[^./]+)\/(\d+)\.html/
            const links = document.getElementsByTagName('a')
            for (let n in links) {
                const link = links[n]
                const result = regexp.exec(link.href)
                if (result != null) {
                    const sku = result[1]
                    if (parseInt(sku) < 100000) {
                        continue
                    }

                    const key = `JD-Item-v2-${sku}`
                    let remote = GM_getValue(key, null)

                    if (remote != null) {
                        console.log('find sku with cache', link.href)

                        if (this.processRemote(JSON.parse(remote), link, sku)) {
                            continue
                        }
                    }

                    GM_xmlhttpRequest({
                        url: `https://spring.pansy.pw/api/v2/promotion/jd/${sku}.js`,
                        method: 'GET',
                        timeout: 10000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Cache-Control': 'public'
                        },
                        onload: (details) => {
                            try {
                                const json = JSON.parse(details.responseText)
                                GM_setValue(key, details.responseText)
                                this.processRemote(json, link, sku)
                            } catch (e) {
                                console.log('request error', e)
                            }
                        },
                        onerror: () => { console.log(`Something Error ${sku}`) },
                        onabort: () => { console.log(`Something Abort  ${sku}`) },
                        ontimeout: console.log(`Something Timeout  ${sku}`)
                    });
                }
            }
        }
        injeryCanvas() {
            const div = document.createElement('div')
            div.style.width = '100%'
            div.appendChild(this.canvas)

            this.injeryButton.className = 'btn-special1 btn-lg'
            // 插入合适位置图表
            document.getElementsByClassName("product-intro clearfix")[0].appendChild(div)
            // 插入合适位置按钮
            // document.getElementsByClassName("choose-btns clearfix")[0].appendChild(this.injeryButton)
        }
    }

    class ChartHelper {
        constructor() {
            // 定义成员变量的方法
            this.colors = {
                red: 'rgb(255, 99, 132)',
                orange: 'rgb(255, 159, 64)',
                yellow: 'rgb(255, 205, 86)',
                green: 'rgb(75, 192, 192)',
                blue: 'rgb(54, 162, 235)',
                purple: 'rgb(153, 102, 255)',
                grey: 'rgb(201, 203, 207)'
            }

            /**
             * 数据表基本结构
             */
            this.data = {
                labels: [],
                datasets: [
                    {
                        label: "历史价格",
                        fill: false,
                        steppedLine: false,
                        backgroundColor: this.colors.blue,
                        borderColor: this.colors.blue,
                        data: []
                    }, {
                        label: "历史均价",
                        steppedLine: false,
                        backgroundColor: this.colors.green,
                        borderColor: this.colors.green,
                        borderDash: [5, 5],
                        fill: false,
                        data: []
                    }, {
                        label: "虚标原价",
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

            let sum = 0
            let count = 0

            historyPrice.forEach((value, key, map) => {
                this.data.labels.push(Utils.timestampToDateString(key))
                this.data.datasets[0].data.push(value)
            });

            // 同步历史均价
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
            datasource.forEach((value, key, map) => {
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
            })

        }
    }

    const supports = [new JD(), new Taobao()]

    supports.filter(site => {
        return site.isWork()
    }).find(site => {
        console.log('Match site', site)
        const ds = new Gwdang(0)
        const chart = new ChartHelper()

        ds.request(site)

        ds.waitForReady(-1).then(() => {
            console.log('ok')
            site.injeryCanvas()
            chart.historyPrice = ds.price
            chart.averagePrice = ds.price
            chart.draw(site.canvas, site.goodsName())
            console.log('well done')
        })
    })
})()
