const Docker = require("dockerode");
var docker = new Docker({ socketPath: "/var/run/docker.sock" });

// list all containers running on the host and stop them all
docker.listContainers({ all: true }, (err, containers) => {
    containers.forEach((container) => {
        docker.getContainer(container.Id).stop(() => {
            console.log(`Container ${container.Id} has been stopped!`);
        });
    })
});