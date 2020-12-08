const { model } = require("../models/model");
const pug = require("pug");
const path = require("path");

const processesTableTempl = pug.compileFile(path.join(__dirname, "../views/containerDetails/processes/processesTable.pug"));
const netInfsTableTempl = pug.compileFile(path.join(__dirname, "../views/containerDetails/network/networkInterfacesTable.pug"));

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
                netInfs: [{ iface: "eth0", operstate: "up" }],
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
        model.subscribeRuntimeInfoFromContainer(req.params.id, (runtimeInfo) => {
            try {
                // create HTML for processes table
                const procsTabHTML = processesTableTempl({ procs: runtimeInfo.processes.list });
                // create HTML for network interfaces table
                const netInfsHTML = netInfsTableTempl({ netInfs: runtimeInfo.networkStats });

                const valObj = {
                    procsTabHTML: procsTabHTML,
                    netInfsHTML: netInfsHTML,
                    processes: runtimeInfo.processes,
                    disksIO: runtimeInfo.disksIO,
                    networkStats: runtimeInfo.networkStats,
                };

                ws.send(JSON.stringify(valObj));
            } catch (error) {
                // Websocket might be closed before callback --> sending over terminated connection --> error
                // TODO implement suitable error handling
            }
        });
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