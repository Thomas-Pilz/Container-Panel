const Dockerode = require("dockerode");
const Docker = require("dockerode");

/**
 * Creates a ContainerModel object used to store or retrieve data.
 * 
 * @class ContainerModel
 * @classdesc Model for the Container Panel app.
 * This class implements the Singleton pattern, so an instance is obtained calling ContainerModel.getInstance().
 * @author Thomas Pilz
 */
class ContainerModel {

    constructor() {
        this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
    }

    test(){
        console.log("test");
    }

    /**
     * Get running containers on a host. If @param all is true, all containers will be returned.
     * @param {boolean} all
     * @returns {Dockerode.ContainerInfo[]} list of (running) containers 
     */
    async getContainers(getAll) {
        return await this.docker.listContainers({all: getAll});
    }

    /**
     * 
     * @returns {Dockerode.ImageInfo[]}
     */
    async getImages(){
        return await this.docker.listImages();
    }
}

// export a model instance
module.exports.model = new ContainerModel();