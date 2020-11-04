// bootstrap colors
const colors = {
    bgPrimary: "#0275d8",
    bgDanger: "#d9534f",
    bgSuccess: "#5cb85c",
    bgInfo: "#5bc0de",
    bgWarning: "#f0ad4e",
    bgSecondary: "#868e96",
    bgDark: "#343a40",
    bgLight: "#f8f9fa",
}

let cpuChart;
let ramChart;
let containerChart;

// attach a delegated event handler to all table rows with an href data attribute to make rows clickable
// even if they are added later on
$(() => {
    // do not change to arrow function as this changes the "this" context
    $(document.body).on("click", "tr[data-js-href]", function () {
        console.log(this.dataset);
        window.location.href = this.dataset.jsHref;
    });
})

// load all charts
window.onload = (e) => {
    initCpuChart();
    initRamChart();
    initContainerChart();
};

function initCpuChart() {
    const ctx = document.getElementById("cpuChart");
    cpuChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Load in %", "Idle in %"],
            datasets: [{
                data: [0, 0],
                backgroundColor: [colors.bgDanger, colors.bgSuccess],
            }]
        },
        options: {
            scales: {
                yAxes: [{
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
            labels: ["Used Memory", "Free Memory"],
            datasets: [{
                data: [16.73, 13.27],
                backgroundColor: [colors.bgDanger, colors.bgSuccess],
                borderWidth: 2,
            }]
        },
        options: {
            scales: {
                yAxes: [{
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
                backgroundColor: [colors.bgSuccess, colors.bgDanger, colors.bgInfo, colors.bgSecondary, colors.bgWarning, colors.bgDark],
                borderColor: "transparent",
                borderWidth: 1,
                data: [3, 2, 1, 1, 1, 1]
            }]
        },
        options: {
            scales: {
                yAxes: [{
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

const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
const serverSocketUrl = socketProtocol + "//" + window.location.hostname + ":" + window.location.port + window.location.pathname
console.log(serverSocketUrl)
const socket = new WebSocket(serverSocketUrl);

socket.onopen = e => {
    console.log("Connection established.");
    socket.send("Hello from client!");
};

socket.onclose = (code, reason) => {
    console.log("connection closed!");
};

socket.onmessage = (e) => {
    socket.send("");
    stats = JSON.parse(e.data);

    // update charts
    updateRamChart(stats.hostStats.mem.used, stats.hostStats.mem.free);
    updateCpuChart(stats.hostStats.currentLoad.currentload);
    updateContainerChart(stats.stateCount);
};

function updateCpuChart(currentLoad){
    cpuChart.data.datasets[0].data[0] = currentLoad;
    cpuChart.data.datasets[0].data[1] = 100 - currentLoad;
    cpuChart.update();
};

function updateRamChart(usedMem, freeMem){
    ramChart.data.datasets[0].data[0] = usedMem;
    ramChart.data.datasets[0].data[1] = freeMem;
    ramChart.update();
};

function updateContainerChart(stateCount){
    // shorten vars
    labels = containerChart.data.labels;
    data = containerChart.data.datasets[0].data;

    for(i = 0; i < labels.length; i++){
        if(stateCount[labels[i].toLowerCase()]){
            data[i] = stateCount[labels[i].toLowerCase()];
        }
        else{
            data[i] = 0;
        }
    }
    containerChart.update();
};