const Docker = require("dockerode");
const si = require("systeminformation");
const { DeepstreamClient } = require('@deepstream/client');


// Initialize global vars
const client = new DeepstreamClient('localhost:6020');          // connect to Deepstream server
docker = new Docker({ socketPath: "/var/run/docker.sock" });    // connect to Docker unix socket
const containerList = "containerList";  // name of list containing registered container in Deepstream.io
login2Deepstream();

const model = {
    /**
     * Login into Deepstream.io server.
     */
    login2Deepstream: async () => {
        login = await client.login();
        if (!login.success) {
            console.log("Deepstream: Login failed.");
        }
        console.log("Deepstream: Login successful.");
    },

    /**
     * Get running containers on a host. If @param all is true, all containers will be returned.
     * @param {boolean} all
     * @returns {Dockerode.ContainerInfo[]} list of (running) containers 
     */
    getContainers: async (getAll) => {
        return await docker.listContainers({ all: getAll });
    },

    /**
     * Get all images stored on a host
     * @returns {Dockerode.ImageInfo[]}
     */
    getImages: async () => {
        return await docker.listImages();
    },

    /**
     * Get current stats from host
     */
    getHostCurrentStats: async () => {
        const desiredStats= {
            currentLoad: "currentload",
            mem: "used, free"
        }

        return await si.get(desiredStats);
    },

    /**
     * Get live runtime information 
     * @param {String} id Container-ID (SHA-256)
     * @callback cb
     * @param {any} data Runtime information of container
     */
    subscribeRuntimeInfoFromContainer: async (id, cb) => {
        const containerList = await client.record.getList(containerList).getEntries();
        if(!containerList.find(id)){
            console.log(`No runtime information available for container ${id}`);
            return {
                err: `No runtime information available for container ${id}`
            };
        }
        curContainer = await client.record.getRecord(`${containerList}/${id}`).subscribe(cb);
    },
};

module.exports.model = model;