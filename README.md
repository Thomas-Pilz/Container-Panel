# Container-Panel
Webapp letting you monitor and manage containers running on the same host.

The docker container can be pulled as follows
´´´docker
docker pull docker.io/thomaspilz/container-panel
´´´

To start the conainer enter the following
´´´docker
docker run --name container-panel -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -it docker.io/thomaspilz/container-panel
´´´

**Info:** If you're using podman, just replace "docker" with "podman"
