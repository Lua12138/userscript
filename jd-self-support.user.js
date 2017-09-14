// ==UserScript==
// @name        京东自营商品展示
// @namespace   gam2046.github.com
// @description 过滤京东商品页，仅显示自营商品
// @author      forDream
// @include     *://list.jd.com/list.html?*
// @include     *://search.jd.com/Search?*
// @run-at      document-idle
// @updateURL   https://raw.githubusercontent.com/gam2046/userscript/master/jd.self.support.user.js
// @supportURL  https://github.com/gam2046/userscript/issues/new
// @version     0.1
// ==/UserScript==

function findJdSelfSupport() {
    console.log("beginning to find jd self support goods.");
    var items = $(".gl-item");
    var count = 0;
    for (var n = 0; n < items.length; n++) {
        var item = items[n];
        if (item.innerHTML.match("//item\.jd\.com/\\d{6,7}.html") == null) {
            item.remove();
            count++;
            console.log("Hidden index of " + n);
        }
    }

    console.log("Total items " + items.length + " blocked " + count);
}

window.setInterval(findJdSelfSupport, 1000);