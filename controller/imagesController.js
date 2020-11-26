const { model } = require("../models/model");

const imagesController = {
    showAllImages: async (req, res) => {
        // try {
        //     res.render("images/allImages", {
        //         title: "All containers",
        //         nav: model.getNav(),
        //     }
        //     );
        // } catch (exception) {
        //     res.status(500).send(exception)
        // }
    },
    showImage: async (req, res) => {
        try {
            const imageDetails = await model.getImage(req.params.id);
            console.log(imageDetails);
            res.render("imageDetails/imageDetails", {
                title: `Image Details - ${req.params.id}`,
                nav: model.getNav(),
                infos: Object.entries(imageDetails),
                layers: [],
            }
            );
        } catch (exception) {
            res.status(500).send(exception)
        }
    },

    subscribeImageInfo: async (ws, req, interval) => {
        return setInterval(sendImageInfo, interval);

        function sendImageInfo() {
            const images = model.getImages();
            if (images) {
                ws.send(JSON.stringify());
            }
        }

        model.subscribeRuntimeInfoFromContainer(req.params.id, (runtimeInfo) => {
            ws.send(JSON.stringify(runtimeInfo));
        });
    },

    unsubscribeImageInfo: async (req, res) => {
        clearInterval()
        await model.containerAction(req.body.id, req.body.action);
        res.end();
    },
}

module.exports.containerController = imagesController;