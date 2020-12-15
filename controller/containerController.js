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
        model.subscribeRuntimeInfoFromContainer(req.params.id, (data) => {
            console.log("Callback with runtime info called");
            try {
                // create HTML for processes table
                console.log(data.processes);
                const procsTabHTML = processesTableTempl({ procs: data.processes.list });
                console.log("Processes succeeded");
                // create HTML for network interfaces table
                const netInfsHTML = netInfsTableTempl({ netInfs: data.networkStats });
                console.log("NetInfs succeeded")
                console.table(data.networkStats);

                const valObj = {   
                    procsTabHTML: procsTabHTML,
                    netInfsHTML: netInfsHTML,
                    processes: data.processes,
                    disksIO: data.disksIO,
                    networkStats: data.networkStats,
                };

                console.log(valObj);
                ws.send(JSON.stringify(valObj));
            } catch (error) {
                console.log(error);
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