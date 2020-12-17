const { model } = require("../models/model");
const pug = require("pug");
const path = require("path");
const formatter = require("../utils/formatter")

const processesTableTempl = pug.compileFile(path.join(__dirname, "../views/containerDetails/processes/processesTable.pug"));
const netInfsTableTempl = pug.compileFile(path.join(__dirname, "../views/containerDetails/network/networkInterfacesTable.pug"));

let activeNWIf = null;

const containerController = {
    showAllContainer: async (req, res) => {
        try {
            res.render("containers/allContainers", {
                title: "All containers",
                nav: model.getNav(),
            }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    showContainer: async (req, res) => {
        try {
            res.render("containerDetails/containerDetails", {
                title: `Container Details - ${req.params.id}`,
                nav: model.getNav(),
                // for test purposes only
                netInfs: [],
                procs: [],
            }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    /**
     * @todo Implement suitable error handling
     */
    subscribeRuntimeInfoFromContainer: async (ws, req) => {
        model.subscribeRuntimeInfoFromContainer(req.params.id, async (data) => {
            console.log(data.processes.list)
            // get host stats
            let hostStats = model.getHostStats();
            const processesInfo = formatter.getAndFormatContainerProcessInfo(data.processes.list);
            data.processes.list = processesInfo.processes;
            hostStats = await hostStats;
            hostStats = formatter.formatHostStats(hostStats);

            // create HTML for processes table
            const procsTabHTML = processesTableTempl({ procs: data.processes.list });
            // create HTML for network interfaces table
            if (activeNWIf === null || !data.networkStats[activeNWIf]) {
                activeNWIf = data.networkStats.length - 1;  // by default display stats of last available network interface
            }
            const netInfsHTML = netInfsTableTempl({ netInfs: data.networkStats, active: activeNWIf });

            const valObj = {
                containerId: req.params.id,
                procsTabHTML: procsTabHTML,
                netInfsHTML: netInfsHTML,
                processes: data.processes,
                disksIO: data.disksIO,
                networkStats: data.networkStats[activeNWIf],
                ram: {
                    usedByContainer: processesInfo.usedRAM,
                    totalUsedHost: hostStats.mem.used,
                    freeHost: hostStats.mem.free,
                },
                cpu: {
                    usedByContainer: processesInfo.usedCPU,
                    totalUsedHost: hostStats.currentLoad.currentload,
                    freeHost: 100 - hostStats.currentLoad.currentload,
                },
            };
            try {
                ws.send(JSON.stringify(valObj));
            } catch (error) {
                console.error(error);
                // Websocket might be closed before callback --> sending over terminated connection --> error
                // TODO implement suitable error handling
            }
        });
    },

    /**
     * Change displayed network interface. This will effect which data is rendered and shown on charts
     * @param {Request} req Request object 
     * @param {WebSocket} res Websocket
     */
    changeNetworkIf: async (req, res) => {
        try {
            activeNWIf = parseInt(req.params.nwId);
        } catch (error) {
            res.status(400).send(error);
        }
        res.end();
    },

    /**
     * Unsubsribe from receiving container 
     */
    unsubscribeRuntimeInfoFromContainer: async (ws, req) => {
        model.unsubscribeRuntimeInfoFromContainer(req.params.id);
    },

    containerAction: async (req, res) => {
        await model.containerAction(req.body.id, req.body.action);
        res.end();
    },
}

module.exports.containerController = containerController;