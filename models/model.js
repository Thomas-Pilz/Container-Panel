const Docker = require("dockerode");
const si = require("systeminformation");
const { DeepstreamClient } = require('@deepstream/client');
const isEqual = require("lodash.isequal");
const isEmpty = require("lodash.isempty");


// Initialize global vars
const client = new DeepstreamClient('localhost:6020');          // connect to Deepstream server
docker = new Docker({ socketPath: "/var/run/docker.sock" });    // connect to Docker unix socket
const containerListName = "containerList";  // name of list containing registered container in Deepstream.io

imageData = {};
containerData = {};

const model = {
    /**
     * Login into Deepstream.io server.
     */
    login2Deepstream: async () => {
        client.login((success, data) => {
            if (!success) {
                console.log("Deepstream: Login failed.");
            }
            console.log("Deepstream: Login successful.");
        });
    },

    getNav: () => {
        return [
            { href: "/dashboard", text: "Dashboard", iconClass: "fas fa-th fa-lg pr-3 text-white" },
            { href: "/containers", text: "Container", iconClass: "fab fa-docker fa-lg pr-3 text-white" },
            { href: "/images", text: "Images", iconClass: "far fa-clone fa-lg pr-3 text-white" },
            { href: "/ressources", text: "Ressources", iconClass: "fas fa-server fa-lg pr-3 text-white" },
        ];
    },

    /**
     * Get data on running containers on a host. Returned data from last call is cached internally and used to determine whether new data is available.
     * If no new data is available false is returned. Otherwise the new data will be returned.
     * Only data specified in the @param fields list will be returned, cached and compared. Possible fields are the ones defined by the Docker API. Look at the reference for further information. 
     * If @param allStates is true, all containers will be returned.
     * @param {boolean} allStates get containers in all possible states
     * @param {boolean} returnVal default: true; when false current container data is retrieved from Docker runtime and compared and only returned if changedcache is not used and current cached data should be compared with the new
     * @param {fields}  fields list of fields to be returned
     * @returns {Dockerode.ContainerInfo[]} list of (running) containers or false if data has not changed
     */
    getContainers: async (allStates, returnVal = false, fields = ["State", "Id", "Names", "Image", "Command"]) => {
        if(returnVal && !isEmpty(containerData)){
            return containerData;
        }
        const newContainerData = await docker.listContainers({ all: allStates });

        // extract, compare and cache only relevant data
        const newContainerList = [];
        newContainerData.forEach(container => {
            let trimmedNewContainerData = {};
            fields.forEach(field => {
                trimmedNewContainerData[field] = container[field];
            });
            newContainerList.push(trimmedNewContainerData);
        });
        if (returnVal || !isEqual(newContainerList, containerData)) {
            // console.log("New container data: \n" + JSON.stringify(newContainerList));
            // console.log("Old container data: \n" + JSON.stringify(containerData));
            containerData = newContainerList;
            return newContainerList;
        }
        return false;
    },

    /**
     * Get all images stored on a host
     * @param {boolean} returnVal default: true; when false current container data is retrieved from Docker runtime and compared and only returned if changedcache is not used and current cached data should be compared with the new
     * @returns {Dockerode.ImageInfo[]}
     */
    getImages: async (returnVal = false) => {
        if(returnVal && !isEmpty(imageData)){
            return imageData;
        }
        const newImageData = await docker.listImages();
        if (returnVal || !isEqual(newImageData, imageData)) {
            imageData = newImageData;
            return newImageData;
        }
        return false;
    },

    /**
     * Get current stats from host
     */
    getHostCurrentStats: async () => {
        const desiredStats = {
            currentLoad: "currentload",
            mem: "used, free"
        }

        return await si.get(desiredStats);
    },

    /**
     * Get live runtime information 
     * @param {String} id Container-ID (SHA-256)
     * @callback Executed every time the runtime information changes
     * @param {any} data Runtime information of container
     */
    subscribeRuntimeInfoFromContainer: async (id, cb) => {
        const containerList = await client.record.getList(containerListName).whenReady();
        if (!containerList.getEntries().find(recordName => recordName === `${containerListName}/${id}`)) {
            console.log(`No runtime information available for container ${id}`);
            return {
                err: `No runtime information available for container ${id}`
            };
        }
        curContainer = await client.record.getRecord(`${containerListName}/${id}`).subscribe(cb);
    },
    
    /**
     * Get amount of containers in the various states
     * @param {Container[]} containers list of containers with State attribute
     */
    getStateCount: (containers) => {
        let stateCount = { exited: 0 };
        containers.forEach(container => {
            if (stateCount[container.State]) {
                stateCount[container.State] += 1;
            }
            else {
                stateCount[container.State] = 1;
            }
        });
        return stateCount;
    },

    containerAction: async (containerId, action) => {
        const container = docker.getContainer(containerId);
        switch (action) {
            case "stop":
                await container.stop();
                console.log(`Stopped container ${containerId}.`);
                break;
            case "restart":
                await container.restart();
                console.log(`Restarted container ${containerId}.`);
                break;
            default:
                console.log(`Nothing done. Action ${action} is unknown.`);
        };
    },
};

model.login2Deepstream();

module.exports.model = model;