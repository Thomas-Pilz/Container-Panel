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

const color4state = {
    exited: "text-danger",
    running: "text-success",
    created: "text-info",
    paused: "text-secondary",
    dead: "text-warning",
    restarting: "text-dark"
};

let cpuChart;
let ramChart;
let containerChart;

// // attach a delegated event handler to all table rows with an href data attribute to make rows clickable
// // even if they are added later on
// $(() => {
//     // do not change to arrow function as this changes the "this" context
//     $(document.body).on("click", "tr[data-js-href]", function () {
//         console.log(this.dataset);
//         window.location.href = this.dataset.jsHref;
//     });
// })

// load all charts
window.onload = (e) => {
    configCharts();
    initCpuChart();
    initRamChart();
    initContainerChart();
    startWebsocketClient();
};

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

function initCpuChart() {
    const ctx = document.getElementById("cpuChart");
    cpuChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Load in %", "Idle in %"],
            datasets: [{
                data: [0, 0],
                backgroundColor: [colors.danger, colors.success],
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    display: false,
                    ticks: {
                        min: 0,
                        max: 100,
                        callback: (value, index, values) => {
                            return value + "%";
                        }
                    }
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

function initRamChart() {
    const ctx = document.getElementById("ramChart");
    ramChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [colors.danger, colors.success],
                borderWidth: 2,
                // datalabels: {
                //     color: "#fff",
                //     anchor: "end",
                //     align: "end",
                //     backgroundColor: (context) => {
                //         return context.dataset.backgroundColor;
                //     },
                //     font: {
                //         weight: 'bold'
                //     },
                //     borderRadius: 10,
                // },
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    display: false,
                    ticks: {
                        min: 0,
                        max: 100,
                        callback: (value, index, values) => {
                            return value + "%";
                        }
                    }
                }]
            },
            legend: {
                display: true,
                position: "bottom"
            },
        }
    });
}

function initContainerChart() {
    const ctx = document.getElementById("containerChart");
    containerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Running', 'Exited', 'Created', 'Paused', 'Dead', 'Restarting'],
            datasets: [{
                backgroundColor: [colors.success, colors.danger, colors.info, colors.secondary, colors.warning, colors.dark],
                borderColor: "transparent",
                borderWidth: 1,
                data: [],
                datalabels: {
                    anchor: "start",
                    align: "middle",
                    clamp: "true",
                    formatter: (value, ctx) => {
                        return ctx.chart.data.labels[ctx.dataIndex] + ": " + value;
                    }
                },
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    gridLines: false,
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                        stepSize: 1,
                    }
                }]
            },
            legend: {
                display: false,
            },
        }
    });
}

function startWebsocketClient(){
    const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
    const serverSocketUrl = socketProtocol + "//" + window.location.hostname + ":" + window.location.port + window.location.pathname
    const socket = new WebSocket(serverSocketUrl);

    socket.onmessage = (e) => {
        const updateEvent = JSON.parse(e.data);
        eventData = updateEvent.eventData;
        switch (updateEvent.eventName) {
            case "updateHostStats":
                // update charts
                updateRamChart(eventData.mem.used, eventData.mem.free);
                updateCpuChart(eventData.currentLoad.currentload);
                break;
            case "updateContainers":
                // update container data
                updateHtmlTable("containerTable-parent", eventData.containerTableHtml);
                updateContainerChart(eventData.stateCount);
                break;
            case "updateImages":
                // update image data
                updateHtmlTable("imageTable-parent", eventData.imageTableHtml);
                break;
            default:
                console.error(`Event ${updateEvent.eventName} is unknown.`);
        }; 
    };    
}


function updateCpuChart(currentLoad) {
    cpuChart.data.datasets[0].data[0] = currentLoad.toFixed(2);
    cpuChart.data.datasets[0].data[1] = (100 - currentLoad).toFixed(2);
    cpuChart.update();
};

function updateRamChart(usedMem, freeMem) {
    usedMem = conv2readableSizeFormat(usedMem);
    freeMem = conv2readableSizeFormat(freeMem);
    ramChart.data.labels[0] = `Used Memory in ${usedMem.unit}`;
    ramChart.data.labels[1] = `Free Memory in ${freeMem.unit}`
    ramChart.data.datasets[0].data[0] = usedMem.val;
    ramChart.data.datasets[0].data[1] = freeMem.val;
    ramChart.update();
};

function conv2readableSizeFormat(size) {
    const factor = 1000;  // use 1000 instead of 1024 because the docker CLI works the same way!
    const sizes = {
        0: "K",
        1: "KB",
        2: "MB",
        3: "GB",
        4: "TB"
    }
    let count = 0;
    let convSize = size;

    while (convSize >= 1024 || count === 4) {
        count++;
        convSize = convSize / factor;
    }
    return {
        val: convSize.toFixed(2),
        unit: sizes[count]
    };
}

function updateContainerChart(stateCount) {
    // shorten vars
    labels = containerChart.data.labels;
    data = containerChart.data.datasets[0].data;

    for (i = 0; i < labels.length; i++) {
        if (stateCount[labels[i].toLowerCase()]) {
            data[i] = stateCount[labels[i].toLowerCase()];
        }
        else {
            data[i] = 0;
        }
    }
    containerChart.update();
};

function updateHtmlTable(parentId, tableHtml) {
    const parent = document.getElementById(parentId);
    parent.removeChild(parent.firstChild);
    parent.innerHTML = tableHtml;
};

function containerAction(containerId, action) {
    url = "/containers/action";
    const stateTriggerButton = document.querySelector(`tr[data-js-href='containers/${containerId}'] td button.start-stop-btn`);
    stateTriggerButton.innerHTML =
        `
    <div class="spinner-border spinner-border-sm text-white" role="status">
        <span class="sr-only">Loading...</span>
    </div>
    `
    // console.log("Request to " + url + " with params " + "\n" + containerId + "\n" + action);
    $.ajax({
        url: url,
        method: "POST",
        data: JSON.stringify({
            id: containerId,
            action: action,
        }),
        contentType: 'application/json',
    });
}