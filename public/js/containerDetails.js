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

    // TEST ONLY
    // test chart update functionality
    setInterval(testUpdate, 1000);
};

/**
 * @todo TEST ONLY: delete this method after test has finished successfully
 */
function testUpdate() {
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
        console.log(runtimeInfo);
    };
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
    while(true){
        if (i === keys.length){
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
                    label: "Total Read I/O",
                    data: [0],
                    backgroundColor: colors.dark,
                    borderColor: colors.dark,
                    fill: false,
                    datalabels: {
                        anchor: "end",
                        align: "middle",
                    }
                },
                {
                    label: "Total Write I/O",
                    data: [0],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: {
                        anchor: "end",
                        align: "middle",
                    }
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
                        callback: (value, index, values) => {
                            return value + " Bytes/s";
                        }
                    }
                }],
                xAxes: [{
                    stacked: true,
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
                    label: "Read I/O per s",
                    data: [],
                    backgroundColor: colors.dark,
                    borderColor: colors.dark,
                    fill: false,
                    datalabels: {
                        display: function (context) {
                            return (context.dataIndex % 5 === 0); // only display every 5th label
                        },
                    }
                },
                {
                    label: "Write I/O per s",
                    data: [],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: {
                        display: function (context) {
                            return (context.dataIndex % 5 === 0); // only display every 5th label
                        },
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
                        callback: (value, index, values) => {
                            return value + " Bytes/s";
                        }
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
 */
function updateIOperSecChart(rSec, wSec) {
    let rSecData = ioPerSecChart.data.datasets[0].data;
    let wSecData = ioPerSecChart.data.datasets[1].data;
    let timeline = ioPerSecChart.data.labels;

    const historySec = 30;
    // remove first element before inserting a new one when max. seconds to be displayed is reached
    if (rSecData.length === historySec) {
        // shift y-axes values
        rSecData.shift();
        wSecData.shift();
        // shift x-axes timeline
        timeline.shift();
    }
    // add y-axes values
    rSecData.push(rSec);
    wSecData.push(wSec);
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
            labels: ["Reveived", "Transferred"],
            datasets: [
                {
                    label: "Total bytes",
                    data: [0, 0],
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                    fill: false,
                    datalabels: {
                        anchor: "end",
                        align: "middle",
                    }
                },
                {
                    label: "Total dropped",
                    data: [0, 0],
                    backgroundColor: colors.warning,
                    borderColor: colors.warning,
                    fill: false,
                    datalabels: {
                        anchor: "end",
                        align: "middle",
                    }
                },
                {
                    label: "Total errors",
                    data: [0, 0],
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    fill: false,
                    datalabels: {
                        anchor: "end",
                        align: "middle",
                    }
                },
            ]
        },
        options: {
            // title: {
            //     text: "Total Network Traffic".toUpperCase(),
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
                        callback: (value, index, values) => {
                            return value + " Bytes";
                        }
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


function updateNWtotalChart(rBytes, rDropped, rErrors, tBytes, tDropped, tErrors) {
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
                    label: "Received traffic per s",
                    data: [],
                    backgroundColor: colors.info,
                    borderColor: colors.info,
                    fill: false,
                    datalabels: {
                        display: function (context) {
                            return (context.dataIndex % 5 === 0); // only display every 5th label
                        },
                    }
                },
                {
                    label: "Transferred traffic per s",
                    data: [],
                    backgroundColor: colors.secondary,
                    borderColor: colors.secondary,
                    fill: false,
                    datalabels: {
                        display: function (context) {
                            return (context.dataIndex % 5 === 0); // only display every 5th label
                        },
                    }
                },
            ]
        },
        options: {
            // title: {
            //     text: "Network Traffic per Sec".toUpperCase(),
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
                        callback: (value, index, values) => {
                            return value + " Bytes/s";
                        }
                    },
                    gridLines: {
                        display: false,
                    },
                }],
                xAxes: [{
                    gridLines: {
                        display: false,
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
 * Update "Network traffic per second" chart
 * @param {Int} rTraffic reveived traffic per second
 * @param {Int} tTraffic transferred traffic per second
 */
function updateNWperSecChart(rTraffic, tTraffic) {
    let rTrafficData = nwPerSecChart.data.datasets[0].data;
    let tTrafficData = nwPerSecChart.data.datasets[1].data;
    let timeline = nwPerSecChart.data.labels;

    const historySec = 30;
    // remove first element before inserting a new one when max. seconds to be displayed is reached
    if (rTrafficData.length === historySec) {
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