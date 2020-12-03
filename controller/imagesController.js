const { model } = require("../models/model");
const texts = require("../utils/texts");
const formatter = require("../utils/formatter");

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
            const imageHistory = await model.getImageHistory(req.params.id);
            
            let layers = [];
            if (imageDetails.RootFS.Type.toLowerCase() === "layers".toLowerCase()){
                layers = imageDetails.RootFS.Layers;
                delete imageDetails.RootFS;
            }

            const config = imageDetails.Config;
            delete imageDetails.Config;

            //format output
            // image details
            imageDetails.Size = formatter.formatSize(imageDetails.Size);
            imageDetails.VirtualSize = formatter.formatSize(imageDetails.VirtualSize);
            imageDetails.Created = formatter.formatDateString(imageDetails.Created);

            // // history
            imageHistory.forEach(it => {
                if (it.Tags === null){
                    it.Tags = [];
                }
                if (it.Id.startsWith("sha")){
                    it.Id = formatter.formatId(it.Id);
                }
                it.Created = formatter.formatDate(it.Created);
                it.Size = formatter.formatSize(it.Size);
            });

            // layers
            layers = layers.map(it => formatter.formatId(it));
            
            res.render("imageDetails/imageDetails", {
                title: `Image Details - ${req.params.id}`,
                nav: model.getNav(),
                infoLabels: texts.imageDetailsLabels.infoLabels,
                info: imageDetails,
                config: config,
                configLabels: texts.imageDetailsLabels.configLabels,
                layers: layers,
                imageHistory: imageHistory,
            }
            );
        } catch (exception) {
            res.status(500).send(exception);
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