// bootstrap colors
const colors = {
    primary: "#0275d8",
    danger: "#d9534f",
    success: "#5cb85c",
    info: "#5bc0de",
    warning: "#f0ad4e",
    secondary: "#868e96",
    dark: "#343a40",
    light: "#f8f9fa",
};

// Charts
// Resource usage and process charts
let processesByStateChart = null;
let cpuUsageByProcessChart = null;
let ramUsageByProcessChart = null;

// Disk I/O charts
let ioPerSecChart = null;
let ioTotalChart = null;

// Network traffic charts
let nwPerSecChart = null;
let nwTotalChart = null;

let previousActiveNWIf = null;
let activeNWIf = 1;

const containerId = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1)

// on page load
window.onload = (e) => {
    // global chart configuration
    configCharts();

    // create and configure the charts
    // Resource usage and process charts
    processesByStateChart = initProcessesByStateChart();
    cpuUsageByProcessChart = initByProcessChart("cpuUsageByProcessChart", "CPU Usage By Process");
    ramUsageByProcessChart = initByProcessChart("ramUsageByProcessChart", "RAM Usage By Process");

    // Disk I/O charts
    ioTotalChart = initIOtotalChart();
    ioPerSecChart = initIOperSecChart();

    // Network traffic charts
    nwTotalChart = initNWtotalChart();
    nwPerSecChart = initNWperSecChart();

    // establish websocket connection to server
    startWebsocketClient();

    // // TEST ONLY
    // // test chart update functionality
    // setInterval(testChartUpdate, 1000);
};

/**
 * @todo TEST ONLY: method called to generate random test data
 * 
 * Generate random test data for all charts
 */
function testChartUpdate() {
    // resource usage and processes
    updateProcessesByStateChart(randomIntBetween(5), randomIntBetween(5), randomIntBetween(5), randomIntBetween(5));

    const colGen = colorGenerator();
    const valObj1 = { label: "Test1", data: 34, backgroundColor: colGen.next().value };
    const valObj2 = { label: "Test2", data: 49, backgroundColor: colGen.next().value };
    const valObj3 = { label: "Test3", data: 41, backgroundColor: colGen.next().value };
    updatePerProcessChart(cpuUsageByProcessChart, [valObj1, valObj2, valObj3]);
    updatePerProcessChart(ramUsageByProcessChart, [valObj1, valObj2, valObj3]);

    // network charts
    updateNWtotalChart(randomIntBetween(50), randomIntBetween(50), randomIntBetween(50), randomIntBetween(50), randomIntBetween(50), randomIntBetween(50));
    updateNWperSecChart(randomIntBetween(50), randomIntBetween(50));

    // disk charts
    updateIOperSecChart(randomIntBetween(50), randomIntBetween(50));
    updateIOtotalChart(randomIntBetween(50), randomIntBetween(50));
}

/**
 * @todo TEST ONLY: method called to generate random test data
 * 
 * Calculates a random integer.
 * @param {Int} start start value, default 0
 * @param {Int} end end value
 * @@returns {Int} random integer between given start and end 
 */
function randomIntBetween(end, start = 0) {
    return (Math.floor(Math.random() * end) + start);
}

/**
 * Establish websocket connection to server and react to server events
 */
function startWebsocketClient() {
    const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
    const serverSocketUrl = socketProtocol + "//" + window.location.hostname + ":" + window.location.port + window.location.pathname
    const socket = new WebSocket(serverSocketUrl);

    socket.onopen = e => {
        console.log(`connection to ${serverSocketUrl} established.`);
    }

    socket.onmessage = (e) => {
        runtimeInfo = JSON.parse(e.data);

        updateContainerInfo(runtimeInfo);
    };
}

/**
 * Update runtime information to be displayed
 * @param {Object} runtimeInfo Object containing runtime information to shown container
 */
function updateContainerInfo(runtimeInfo) {
    // update HTML tables
    updateHTMLTable("processes-table", runtimeInfo.procsTabHTML);
    updateHTMLTable("network-interfaces-table", runtimeInfo.netInfsHTML);

    // resource usage and processes
    updateProcessesByStateChart(runtimeInfo.processes.running, runtimeInfo.processes.sleeping, runtimeInfo.processes.blocked, runtimeInfo.processes.blocked);

    const processes = runtimeInfo.processes.list;

    const cpuUsageByProcs = [];
    const ramUsageByProcs = [];
    const colGen = colorGenerator();
    // push 
    const green = colGen.next().value; // first color will be green and next ones not --> distinguishable --> DO NOT MODIFY ORDER
    const red = colGen.next().value; // second color will be red and next ones not --> distinguishable --> DO NOT MODIFY ORDER
    cpuUsageByProcs.push({ label: "Free", data: runtimeInfo.cpu.freeHost.toFixed(2), backgroundColor: green });
    cpuUsageByProcs.push({ label: "Other processes", data: (runtimeInfo.cpu.totalUsedHost - runtimeInfo.cpu.usedByContainer).toFixed(2), backgroundColor: red });
    ramUsageByProcs.push({ label: "Free", data: conv2SizeUnit(runtimeInfo.ram.freeHost, "GB"), backgroundColor: green });
    ramUsageByProcs.push({ label: "Other processes", data: conv2SizeUnit(runtimeInfo.ram.totalUsedHost - runtimeInfo.ram.usedByContainer, "GB"), backgroundColor: red });
    processes.forEach(it => {
        // generate one color for each process (the same process will have the same color in both charts)
        const col = colGen.next().value;
        cpuUsageByProcs.push({ label: it.name, data: it.pcpu.toFixed(2), backgroundColor: col });
        ramUsageByProcs.push({ label: it.name, data: conv2SizeUnit(it.pmem, "GB"), backgroundColor: col });
    });

    updatePerProcessChart(cpuUsageByProcessChart, cpuUsageByProcs);
    updatePerProcessChart(ramUsageByProcessChart, ramUsageByProcs);

    // network charts
    const nw = runtimeInfo.networkStats;
    updateNWtotalChart(nw.iface, nw.rx_bytes, nw.rx_dropped, nw.rx_errors, nw.tx_bytes, nw.tx_dropped, nw.tx_errors);
    updateNWperSecChart(nw.iface, nw.rx_sec.toFixed(0), nw.tx_sec.toFixed(0));

    // disk charts
    const d = runtimeInfo.disksIO;
    updateIOperSecChart(d.rIO_sec.toFixed(0), d.wIO_sec.toFixed(0), d.tIO_sec.toFixed(0));
    updateIOtotalChart(d.rIO, d.wIO);
}

/**
 * Set global chart configuration
 */
function configCharts() {
    Chart.defaults.global.tooltips.titleFontSize = 16;
    Chart.defaults.global.tooltips.bodyFontSize = 14;
    Chart.defaults.global.showLines = false;

    Chart.defaults.global.plugins.datalabels = {
        color: "#fff",
        anchor: "start",
        align: "middle",
        backgroundColor: (context) => {
            return context.dataset.backgroundColor;
        },
        font: {
            weight: 'bold',
        },
        padding: {
            top: "8",
            right: "8",
            left: "8",
            bottom: "8",
        },
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "white",
    }
}

/**
 * Create and configure "Processes by state" chart
 */
function initProcessesByStateChart() {
    const ctx = document.getElementById("processesByStateChart");
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Running", "Sleeping", "Blocked", "Unknown"],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [colors.success, colors.danger, colors.warning, colors.secondary],
            }],
        },
        options: {
            // title: {
            //     text: "Processes By State".toUpperCase(),
            //     display: true,
            //     fontSize: 20,
            //     fontStyle: "normal",
            //     fontColor: "black",
            // },
            scales: {
                yAxes: [{
                    display: false,
                    // ticks: {
                    //     min: 0,
                    //     max: 100,
                    // }
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update "Processes´ states" chart
 * @param {Int} running  number of process that are in state running
 * @param {Int} sleeping number of process that are in state sleeping
 * @param {Int} blocked number of process that are in state blocked
 * @param {Int} unknown number of process that are in state unknown
 */
function updateProcessesByStateChart(running, sleeping, blocked, unknown) {
    processesByStateChart.data.datasets[0].data[0] = running;
    processesByStateChart.data.datasets[0].data[1] = sleeping;
    processesByStateChart.data.datasets[0].data[2] = blocked;
    processesByStateChart.data.datasets[0].data[3] = unknown;
    processesByStateChart.update();
}

/**
 * Create a doughnut chart which shows information by process
 * @param {String} id ID of a canvas element within the document
 */
function initByProcessChart(id, title) {
    const ctx = document.getElementById(id);
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
            }],
        },
        options: {
            // title: {
            //     text: title.toUpperCase(),
            //     display: true,
            //     fontSize: 20,
            //     fontStyle: "normal",
            //     fontColor: "black",
            // },
            scales: {
                yAxes: [{
                    display: false,
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update a chart that displays information per process.
 * Objects within list must adhere to following objet structure:
 * {
 *    label: "Process name"
 *    data: "any data" e.g. cpu usage
 *    backgroundColor: "color"
 * }
 * @param {Chart} chart 
 * @param {Object[]} usageProcesses 
 */
function updatePerProcessChart(chart, usageProcesses) {
    let labels = [];
    let data = [];
    let backgroundColors = [];
    usageProcesses.forEach(it => {
        labels.push(it.label);
        data.push(it.data);
        backgroundColors.push(it.backgroundColor);
    });

    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = backgroundColors;
    chart.data.labels = labels;
    chart.update();
}

/**
 * Color generator. Returns all colors in "colors" one after another and starts from the front again if the end of "colors" is reached
 * @returns {String} color in HEX notation (e.g. #5af189)
 */
function* colorGenerator() {
    let i = 0;
    const keys = Object.keys(colors);
    while (true) {
        if (i === keys.length) {
            i = 0;
        }
        yield colors[keys[i++]];
    }
}

/**
 * Create and configure "I/O Total" chart
 */
function initIOtotalChart() {
    const ctx = document.getElementById("ioTotalChart");
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Total I/O"],
            datasets: [
                {
                    label: "Read [Bytes]",
                    data: [0],
                    backgroundColor: colors.dark,
                    borderColor: colors.dark,
                    fill: false,
                    datalabels: { anchor: "end", align: "middle" },
                },
                {
                    label: "Write [Bytes]",
                    data: [0],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: { anchor: "end", align: "middle" },
                },
            ]
        },
        options: {
            // title: {
            //     text: "Total I/O".toUpperCase(),
            //     display: true,
            //     fontSize: 20,
            //     fontStyle: "normal",
            //     fontColor: "black",
            // },
            scales: {
                yAxes: [{
                    stacked: true,
                    display: true,
                    ticks: {
                        min: 0,
                        // callback: (value, index, values) => {
                        //     return value + " Bytes/s";
                        // }
                    },
                    gridLines: {
                        display: false,
                    },
                }],
                xAxes: [{
                    stacked: true,
                    display: false,
                    gridLines: {
                        display: false,
                    },
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update "I/O Total" chart
 * @param {Int} rT total read I/O
 * @param {Int} wT total write I/O 
 */
function updateIOtotalChart(rT, wT) {
    ioTotalChart.data.datasets[0].data[0] = rT;
    ioTotalChart.data.datasets[1].data[0] = wT;
    ioTotalChart.update();
}

/**
 * Create and configure "I/O per second" chart
 */
function initIOperSecChart() {
    const ctx = document.getElementById("ioPerSecChart");
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: "Read [Bytes/s]",
                    data: [],
                    backgroundColor: colors.dark,
                    borderColor: colors.dark,
                    fill: false,
                    datalabels: {
                        display: false,
                    }
                },
                {
                    label: "Write [Bytes/s]",
                    data: [],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: {
                        display: false,
                    }
                },
                {
                    label: "Total [Bytes/s]",
                    data: [],
                    backgroundColor: colors.warning,
                    borderColor: colors.warning,
                    fill: false,
                    datalabels: {
                        display: false,
                    }
                },
            ]
        },
        options: {
            // title: {
            //     text: "I/O per Sec".toUpperCase(),
            //     display: true,
            //     fontSize: 20,
            //     fontStyle: "normal",
            //     fontColor: "black",
            // },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        min: 0,
                        // callback: (value, index, values) => {
                        //     return value + " Bytes/s";
                        // }
                    }
                }],
                xAxes: [{
                    display: true,
                }],
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update "I/O per second" chart
 * @param {Int} rSec read I/O per second
 * @param {Int} wSec write I/O per second
 * @param {Int} wSec total I/O per second
 */
function updateIOperSecChart(rSec, wSec, tSec) {
    let rSecData = ioPerSecChart.data.datasets[0].data;
    let wSecData = ioPerSecChart.data.datasets[1].data;
    let tSecData = ioPerSecChart.data.datasets[2].data;
    let timeline = ioPerSecChart.data.labels;

    const historySec = 30;
    // remove first element before inserting a new one when max. seconds to be displayed is reached
    if (timeline.length === historySec) {
        // shift y-axes values
        rSecData.shift();
        wSecData.shift();
        tSecData.shift();
        // shift x-axes timeline
        timeline.shift();
    }
    // add y-axes values
    rSecData.push(rSec);
    wSecData.push(wSec);
    tSecData.push(tSec)
    // add x-axes time
    const current = new Date();
    timeline.push(`${current.getHours().toString().padStart(2, "0")}:${current.getSeconds().toString().padStart(2, "0")}`);

    // update chart
    ioPerSecChart.update();
}

/**
 * Create and configure "Network traffic total" chart
 */
function initNWtotalChart() {
    const ctx = document.getElementById("nwTotalChart");
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Received", "Transferred"],
            datasets: [
                {
                    label: "Successful [Bytes]",
                    data: [0, 0],
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                    fill: false,
                    datalabels: { anchor: "end", align: "middle" },
                },
                {
                    label: "Dropped [Bytes]",
                    data: [0, 0],
                    backgroundColor: colors.warning,
                    borderColor: colors.warning,
                    fill: false,
                    datalabels: { anchor: "end", align: "middle" },
                },
                {
                    label: "Error [Bytes] ",
                    data: [0, 0],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: { anchor: "end", align: "middle" },
                },
            ]
        },
        options: {
            title: {
                text: "",
                display: true,
                fontSize: 20,
                fontStyle: "normal",
                fontColor: "black",
            },
            scales: {
                yAxes: [{
                    stacked: true,
                    display: true,
                    ticks: {
                        min: 0,
                        // callback: (value, index, values) => {
                        //     return value + " Bytes";
                        // }
                    },
                    gridLines: {
                        display: false,
                    },
                }],
                xAxes: [{
                    stacked: true,
                    display: true,
                    gridLines: {
                        display: false,
                    },
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update total network traffic chart
 * @param {String} ifName name of network interface
 * @param {number} rBytes   successfully received bytes
 * @param {number} rDropped received dropped bytes
 * @param {number} rErrors  received error bytes
 * @param {number} tBytes   successfully transferred bytes 
 * @param {number} tDropped transferred dropped bytes
 * @param {number} tErrors  transferred error bytes
 */
function updateNWtotalChart(ifName ,rBytes, rDropped, rErrors, tBytes, tDropped, tErrors) {
    if(ifName !== nwTotalChart.options.title.text){
        nwTotalChart.options.title.text = ifName;   // set title to interface name
        nwTotalChart.data.datasets.forEach(it => {  // clear data
            it.data = []; 
        });
    }
    // Received
    nwTotalChart.data.datasets[0].data[0] = rBytes;
    nwTotalChart.data.datasets[1].data[0] = rDropped;
    nwTotalChart.data.datasets[2].data[0] = rErrors;

    // Transferred
    nwTotalChart.data.datasets[0].data[1] = tBytes;
    nwTotalChart.data.datasets[1].data[1] = tDropped;
    nwTotalChart.data.datasets[2].data[1] = tErrors;

    nwTotalChart.update();
}


/**
 * Create and configure "I/O per second" chart
 */
function initNWperSecChart() {
    const ctx = document.getElementById("nwPerSecChart");
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: "Received [Bytes/s]",
                    data: [],
                    backgroundColor: colors.info,
                    borderColor: colors.info,
                    fill: false,
                    datalabels: {
                        display: false,
                    }
                },
                {
                    label: "Transferred [Bytes/s]",
                    data: [],
                    backgroundColor: colors.secondary,
                    borderColor: colors.secondary,
                    fill: false,
                    datalabels: {
                        display: false,
                    }
                },
            ]
        },
        options: {
            title: {
                text: "",
                display: true,
                fontSize: 20,
                fontStyle: "normal",
                fontColor: "black",
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        min: 0,
                        // callback: (value, index, values) => {
                        //     return value + " Bytes/s";
                        // }
                    },
                    gridLines: {
                        display: true,
                    },
                }],
                xAxes: [{
                    gridLines: {
                        display: true,
                    },
                    display: true,
                }],
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

/**
 * Update "Network traffic per second" chart.
 * @param {String} ifName name of network interface
 * @param {number} rTraffic reveived traffic per second
 * @param {number} tTraffic transferred traffic per second
 */
function updateNWperSecChart(ifName, rTraffic, tTraffic) {
    let rTrafficData = nwPerSecChart.data.datasets[0].data;
    let tTrafficData = nwPerSecChart.data.datasets[1].data;
    let timeline = nwPerSecChart.data.labels;
    if(ifName !== nwPerSecChart.options.title.text){
        nwPerSecChart.options.title.text = ifName;   // set title to interface name
        nwPerSecChart.data.datasets.forEach(it => {  // clear data
            it.data = []; 
        });
        nwPerSecChart.data.labels = [];
    }

    const historySec = 30;
    // remove first element before inserting a new one when max. seconds to be displayed is reached
    if (timeline.length === historySec) {
        // shift y-axes values
        rTrafficData.shift();
        tTrafficData.shift();
        // shift x-axes timeline
        timeline.shift();
    }
    // add y-axes values
    rTrafficData.push(rTraffic);
    tTrafficData.push(tTraffic);
    // add x-axes time
    const current = new Date();
    timeline.push(`${current.getHours().toString().padStart(2, "0")}:${current.getSeconds().toString().padStart(2, "0")}`);

    // update chart
    nwPerSecChart.update();
}

/**
 * Replaces a HTML table identified by @param id with the HTML specified in @param newTableHTML in the DOM.
 * @param {String} id 
 * @param {String} newTableHTML String 
 */
function updateHTMLTable(id, newTableHTML) {
    // get table
    const oldTab = document.getElementById(id);
    // get parent of table
    const tabParent = oldTab.parentElement;
    // replace child
    tabParent.innerHTML = newTableHTML;
}

function onNwInterfaceShow(e, ifId){
    e.preventDefault();

    $.ajax({
        url: `/containers/lol/${ifId}`,
        // data: {
        //     nwId: ifId,
        // },
        method: "GET",
        // button will automatically be enabled again cause of state change of container as this state change will trigger the server to render and send a
        // new version of the table html
        // success: () => { stateTriggerButton.disabled = false; },  
    });
    // activeNWIf = ifId; // change active ID --> rest will be taken care of as soon as the next update takes place
}

/**
 * Convert size given in bytes to another unit.
 * Note: Decimalprefixes only, no binary prefixes! --> conversion factor: 1000
 * @param {number} size size in bytes
 * @param {String} unit unit to be converted to ["K", "KB", "MB", "GB", "TB"]
 * @param {number} fractDigits number of fractional digits; default = 2;
 * @param {boolean} withLabel add a unit label 
 * @returns {String/ float} formatted size
 */
function conv2SizeUnit(size, unit, fractDigits = 2, withLabel = false) {
    if (!(typeof fractDigits === "number") || fractDigits < 0) {
        return console.error("Invalid argument fractDigits");
    }

    const factor = 1000;  // use 1000 instead of 1024 because GB not GiB are used to match docker cli behavior
    const sizes = {
        "K": 0,
        "KB": 1,
        "MB": 2,
        "GB": 3,
        "TB": 4,
    }
    const unitId = sizes[unit.toUpperCase()];
    if (!unitId) {
        return console.error(`Unsupported unit: use either one of these: ${Object.keys(sizes)}.`);
    }

    let convSize = size;
    let count = 0;
    while (!(count === unitId)) {
        count++;
        convSize = convSize / factor;
    }

    if (withLabel) {
        return convSize.toFixed(fractDigits) + " " + unit;
    }
    return convSize.toFixed(fractDigits);
}