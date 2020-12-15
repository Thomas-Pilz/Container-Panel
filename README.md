# Container-Panel
Webapp to get information on Docker images and containers on a host running the Docker daemon. Additionally some small actions on containers can be performed such as stopping or restarting containers.

## How to get it
The docker container can be pulled from the Docker Container Registry as follows:
```shell
docker pull docker.io/thomaspilz/container-panel
```
## How to start it
To start the conainer enter the following
```shell
docker run --name [desired name] -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock --network [network] docker.io/thomaspilz/container-panel
```
**Important:** To get live information from a [Container-Client](https://github.com/Thomas-Pilz/Container-Client "Github Repository: Container-Client") a [Deepstream.io](https://deepstream.io/ "Deepstrem.io Website") container is used and must be running in the same network to enable communication between the containers. The Container-Client itself therefore has to be in the same network as well. Furthermore, because of Docker service discovery the deepstream.io container has to be named "deepstream" at the moment to enable communication. Both these restriction may be lifted and configurable in a later version.

*Please note:* If you're using podman, you need to replace "docker" with "podman" or create an alias. At the moment for this to work one has to additionally enable the Podman API service and create a Symlink from "/var/run/docker.sock" to "/run/podman/podman.sock" as the panel is always trying to connect to the docker socket. On Linux systems a package podman-docker may be available to take care of that. Please notice that the panel makes use of the Docker API and its specification and only works with Podman because the Podman API is compatibel with the Docker API.

For more detailed information please see: [Podman API Reference](http://docs.podman.io/en/latest/_static/api.html "Podman API Reference")

## How it works
As soon as the application launches it will try to connect to a Deepstream.io container named "deepstream" at Port 6060. Reconnection attempts will be undertaken at least every 30 seconds if this does not succeed. If a connection cannot be established no *live* container data will be available within the application (This might change in the future when using the Docker API for this).
All other information available (that is everything but the live container data at endpoint /containers/<containerId>) will by used leveraging the Docker API. By reason of that, the Docker Unix Socket at "/var/run/docker.sock" must be made available to the Container-Panel container as a volume, since it serves the API requests. 
Information on containers and images will be retrieved every second and cached internally. As soon as something changes all connected cients will be notified and updated with the most recent data.

## Possible improvements for coming versions
- [ ] make application port configurable
- [ ] make deepstream.io container name and port (for service discovery) configurable
- [ ] use Docker API instead of deepstream.io and special container client to retrieve live container data
