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


// attach a delegated event handler to all table rows with an href data attribute to make rows clickable
// even if they are added later on
$(() => {
    // do not change to arrow function as this changes the "this" context
    $(document.body).on("click", "tr[data-js-href]", function(){
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
    var ctx = document.getElementById("cpuChart");
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            datasets: [{
                data: [35.5, 38, 42, 40.9, 39.2, 37.9, 40.4],
                backgroundColor: 'transparent',
                borderColor: colors.bgPrimary,
                borderWidth: 2,
                pointBackgroundColor: '#FFF'
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false,
            }
        }
    });
}

function initRamChart() {
    var ctx = document.getElementById("ramChart");
    var myChart = new Chart(ctx, {
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
    var ctx = document.getElementById("containerChart");
    var myChart = new Chart(ctx, {
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


