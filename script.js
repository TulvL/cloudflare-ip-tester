var urlprefix = ".ip.flares.cloud"
var imgUrls = ["/img/s.webp", "/img/m.webp", "/img/l.webp"]
var imgBytes = [117902, 1263924, 10914532]
var imgi = 1
var pingInterval = 100
var pingUrl = "/cdn-cgi/trace"
var respondTimeout = 4000
var speedTimeout = 30000

var idn = 0
var database = {}


// Main Table
options = {
    selectable: true,
    layout: "fitDataTable",
    downloadRowRange: "selected",
    rowSelected: function (row) {
        select_1()
    },
    rowDeselected: function (row) {
        var selectedRows = table.getSelectedRows()
        if (selectedRows.length == 0)
            select_0()
    },
    columns: [
        { title: "IP address", field: "ip" },
        { title: "Region", field: "region" },
        {
            title: "Mean Respond Time", field: "time", sorter: "number", sorterParams: {
                alignEmptyValues: "bottom",
            }
        },
        {
            title: "Mean Download Speed", field: "speed", sorter: "number", sorterParams: {
                alignEmptyValues: "bottom",
            }
        },
    ],
}
if (typeof (page) != 'undefined' && page) {
    options.pagination = "local" // pagination may cause problem in mobile devices
    options.paginationSize = 100
}
table = new Tabulator("#main-table", options)


// Panel
function select_0() {
    $("#select-all").attr("status", 0)
    $("#select-all").text("Select All")
}
function select_1() {
    $("#select-all").attr("status", 1)
    $("#select-all").text("Deselect All")
}
$("#select-all").click(function () {
    if ($("#select-all").attr("status") == 0) {
        table.selectRow()
        select_1()
    } else {
        table.deselectRow()
        select_0()
    }
})

$("#select-random").click(function () {
    table.deselectRow()
    var idList = []
    var cList = []
    var sn = $("#select-number").val()
    table.getRows().forEach(function (one) {
        idList.push(one.getData().id)
    })
    for (var i = 0; i < sn; i++) {
        var s = Math.floor(Math.random() * idList.length)
        cList.push(idList.splice(s, 1)[0])

    }
    table.selectRow(cList.sort())
})

$("#download").click(function () {
    table.download("csv", "test_result.csv", {bom:true}) 
    // include BOM to ensure that UTF-8 characters can be correctly interpereted
})


// Respond time test
function tcpingCallback(time, id) {
    database[id].time.push(time)
    var alln = database[id].time.length
    var validset = []
    var sum = 0
    database[id].time.forEach(function (one) {
        if (one > 0) {
            validset.push(one)
            sum += one
        }
    })
    var validn = validset.length
    var mean = sum / validn
    var str = ""
    if (validn > 1) {
        str = " (" + validn + "/" + alln + ")"
        var sumsq = 0
        validset.forEach(function (one) {
            sumsq += Math.pow(one - mean, 2)
        })
        var std = Math.sqrt(sumsq / validn)
        str = mean.toFixed(1) + "ms" + " σ=" + std.toFixed(1) + str
    }
    else if (validn == 1) {
        str = mean.toFixed(1) + "ms" + str
    }
    else {
        str = "Timeout" + str
    }
    table.updateData([{ id: id, time: str }])
}

function tcping(addr, callback, id) {
    //var started = new Date().getTime()
    var started = window.performance.now()
    var http = new XMLHttpRequest()
    http.open("GET", addr, true)
    http.onreadystatechange = function () {
        if (http.readyState == 2) {
            //var ended = new Date().getTime()
            var ended = window.performance.now()
            var milliseconds = ended - started
            if (callback != null) {
                callback(milliseconds, id)
                callback = null
            }
        }
        else if (http.readyState == 4) {
            if (callback != null)
                callback(-1, id)
        }
    }
    http.onload = function () {
        var resp = http.responseText
        var loc = resp.split("\n")[6].split("=")[1]
        table.updateData([{ id: id, region: loc }])
    }
    http.timeout = respondTimeout
    http.send(null)
}

var positionSort = function(a,b){
    return a.getPosition(true) - b.getPosition(true)
}

$("#test-respond").click(function () {
    var selectedRows = table.getSelectedRows()
    var sn = selectedRows.length
    if (sn > 0) {
        $("#test-respond").prop("disabled", true)
        selectedRows.sort(positionSort)
        selectedRows.forEach(function (row, i) {
            var one = row.getData()
            setTimeout(function () {
                addr = "//" + one.ip.replace(/\./g, "-") + urlprefix + pingUrl + "?" + Math.random()
                // break cache (set the header of request or origin is not enough in Firefox)
                tcping(addr, tcpingCallback, one.id)
            }, pingInterval * (i + sn / 100))
        })
        setTimeout(function () {
            table.redraw(true)
            $("#test-respond").prop("disabled", false)
        }, pingInterval * (sn + 2))
        if (sn > 10) {
            setTimeout(function () {
                table.redraw(true)
            }, pingInterval * 12)
        }
    }
})


// Speed test
function speedProgressCallback(rbytes, time, id) {
    var rate = rbytes / imgBytes[imgi] * 100
    var speed = (rbytes / 1024) / (time / 1000)
    var str = speed.toFixed(1) + " KB/s " + rate.toFixed(1) + " %"
    table.updateData([{ id: id, speed: str }])
}

function speedEndCallback(rbytes, time, id) {
    var speed = (rbytes / 1024) / (time / 1000)
    database[id].speed.push(speed)
    var alln = database[id].speed.length
    var validset = []
    var sum = 0
    database[id].speed.forEach(function (one) {
        if (one > 0 && rbytes / imgBytes[imgi] > 0.05) { // in case 403
            validset.push(one)
            sum += one
        }
    })
    var validn = validset.length
    var mean = sum / validn
    var str = ""
    if (validn > 1) {
        str = " (" + validn + "/" + alln + ")"
        var sumsq = 0
        validset.forEach(function (one) {
            sumsq += Math.pow(one - mean, 2)
        })
        var std = Math.sqrt(sumsq / validn)
        str = mean.toFixed(1) + " KB/s" + " σ=" + std.toFixed(1) + str
    }
    else if (validn == 1) {
        str = mean.toFixed(1) + " KB/s" + str
    }
    else {
        str = "Error" + str
    }
    table.updateData([{ id: id, speed: str }])

}

function speedRecur(list, i) {
    if (i >= list.length) {
        table.redraw(true)
        $("#test-speed").prop("disabled", false)
        $("#img-select").prop("disabled", false)
        return
    }
    else if (i == 3) {
        table.redraw(true)
    }

    var one = list[i]
    var id = one.id
    var addr = one.addr
    //var started = new Date().getTime()
    var started = window.performance.now()
    var http = new XMLHttpRequest()
    http.open("GET", addr, true)
    http.onreadystatechange = function () {
        /*
        cut the initialization time can be more accurate (or the speed will show a state of slow climbing)
        but meeting dash 
        if (http.readyState == 2)
            started = window.performance.now() 
        */
    }
    http.loadr = 0
    http.onloadend = function (e) { //
        var rbytes = (e.loaded == 0) ? http.loadr : e.loaded // In Firefox, error or timeout will always return 0
        var ended = window.performance.now()
        var milliseconds = ended - started
        speedEndCallback(rbytes, milliseconds, id)
        speedRecur(list, i + 1)
    }
    http.onprogress = function (e) {
        var rbytes = e.loaded
        http.loadr = rbytes
        var ended = window.performance.now()
        var milliseconds = ended - started
        if (milliseconds > 100) // fix first jump
            speedProgressCallback(rbytes, milliseconds, id)
    }
    http.timeout = speedTimeout
    http.send()
}

$("#test-speed").click(function () {
    imgi = $("#img-select").val()
    var selectedRows = table.getSelectedRows()
    if (selectedRows.length > 0) {
        $("#test-speed").prop("disabled", true)
        $("#img-select").prop("disabled", true)
        selectedRows.sort(positionSort)
        sList = []
        selectedRows.forEach(function (row) {
            var one = row.getData()
            sList.push({
                id: one.id,
                addr: "//" + one.ip.replace(/\./g, "-") + urlprefix + imgUrls[imgi] + "?" + Math.random()
            })
        })
        speedRecur(sList, 0) // Make sure run in turn
    }

})


// Entry
function tablemake(data) {
    var initData = []
    ip_list = data.split("\n")
    ip_list.forEach(function (one_ip) {
        initData.push({
            id: idn,
            ip: one_ip,
            time: "",
            speed: ""
        })
        database[idn] = {
            time: [],
            speed: []
        }
        idn += 1
    })
    table.replaceData(initData)
    $("#select-number").attr("max", idn)
}
