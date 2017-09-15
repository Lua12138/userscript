// ==UserScript==
// @name        京东自营商品展示
// @namespace   gam2046.github.com
// @description 过滤京东商品页，仅显示自营商品，在列表筛选中会新增一项可以勾选是否仅显示自营商品
// @author      forDream
// @include     *://list.jd.com/list.html?*
// @include     *://search.jd.com/Search?*
// @run-at      document-idle
// @updateURL   https://github.com/gam2046/userscript/raw/master/jd-self-support.user.js
// @supportURL  https://github.com/gam2046/userscript/issues/new
// @version     0.2
// ==/UserScript==

(function () {
    'use strict';

    var selected = false;
    var liTagName = "fd_show_jd_self_support";
    var aTagName = "fd_shown_jd_self_support_link";

    function findJdSelfSupport() {
        console.log("beginning to find jd self support goods.");
        var items = $(".gl-item");
        var count = 0;
        for (var n = 0; n < items.length; n++) {
            var item = items[n];
            if (selected) { // 选中对话框
                if (item.innerHTML.match("//item\.jd\.com/\\d{6,7}.html") == null) {
                    item.hidden = true;
                    count++;
                    console.log("Hidden index of " + n);
                }
            } else {
                item.hidden = false;
            }
        }

        console.log("Total items " + items.length + " blocked " + count);
    }

    function addCheckbox() {
        if (document.getElementById(liTagName) != null) {
            document.getElementById(aTagName).className = selected ? "selected" : "";
            return;
        }

        var ul = document.getElementById("J_feature").children[0];
        var li = document.createElement("li");
        var a = document.createElement("a");

        a.id = aTagName;
        a.href = "javascript:;";
        a.className = selected ? "selected" : "";
        a.innerHTML = "<i></i>仅显示京东自营商品";
        a.onclick = clickCheckbox;

        li.id = liTagName;
        li.appendChild(a);
        ul.appendChild(li);
    }

    function clickCheckbox() {
        selected = !selected;
        addCheckbox();
    }

    window.setInterval(findJdSelfSupport, 2000);
    window.setInterval(addCheckbox, 2000);
})();
