const { model } = require("../models/model");

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
                procs: [
                {
                    pid: "Test",
                    state: "Test",
                    name: "Test",
                    priority: "Test",
                    parent: "Test",
                    started: "Test",
                    tty: "Test",
                    user: "Test",
                    pmen: "Test",
                    path: "Test",
                    command: "Test",
                    params: "Test",
                },
                {
                    pid: "Test",
                    state: "Test",
                    name: "Test",
                    priority: "Test",
                    parent: "Test",
                    started: "Test",
                    tty: "Test",
                    user: "Test",
                    pmen: "Test",
                    path: "Test",
                    command: "Test",
                    params: "Test",
                },
            ],
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
                ws.send(JSON.stringify(runtimeInfo));
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