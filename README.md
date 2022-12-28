![Github Actions: Go Tests](https://github.com/dataplane-app/dataplane/actions/workflows/main-runtests.yml/badge.svg) 
![Docker Pulls](https://img.shields.io/docker/pulls/dataplane/dataplane-worker-python?label=Docker%20pulls)
[![Discord](https://img.shields.io/discord/1000429753205014528?label=Discord%20chat)](https://discord.gg/Ztu4ASNky8)
[![Documentation](https://img.shields.io/badge/documentation-orange)](https://learn.dataplane.app/create-a-data-pipeline)
[![Recipes](https://img.shields.io/badge/recipes-blue)](https://recipes.dataplane.app/)

If you like Dataplane, give it a star ⭐

## Dataplane
⚡️ Written in Golang and compiled to machine code to achieve extreme performance with a low memory and CPU footprint. <br />
🖐 Drag drop data pipeline builder. <br />
🧑‍💻 Built in Python code editor. <br />
👮 Granular permissions for teams to collaborate with segregated access. <br />
🐿 Secrets management with logging redaction allows team members to use secure resources without revealing passwords. <br />
⏱ Scheduler with multiple time zone support. <br />
🌍 Setup isolated environments to develop, test & deploy across data mesh domains. <br />
📊 Monitor real-time resource usage by analytical workloads. <br />
⭐️ Distributed computing with worker groups. <br />
🌳 Add more replicas for high availability and scale. <br />
☁️ Cloud native  <br />

![Pipeline Running Screen Recording 4K pre render v2](https://user-images.githubusercontent.com/63714857/166139437-3020ac63-7ae6-4265-a301-29e5448451eb.gif)

## Dataplane Community
[Discord chat](https://discord.gg/Ztu4ASNky8) is the quickest way to meet and interact with the community.

[Github Discussions](https://github.com/dataplane-app/dataplane/discussions) is preferred when proposing new ideas and longer discussions that need more thought.

[GitHub Issues](https://github.com/dataplane-app/dataplane/issues) is reserved only for actual issues. 

[Roadmap](https://github.com/orgs/dataplane-app/projects/1/views/1) to view work prioritisation, work in progress and back log.


## About the project
The idea behind Dataplane is to make it quicker and easier to build robust data pipelines and automated workflows for businesses and teams of all sizes. In addition to being more user friendly, there has been an emphasis on scaling, resilience, performance and security. It is early days for Dataplane with the first release. We would love to hear your thoughts and for you to get involved.
<br /><br />
Website: https://dataplane.app/ <br />
Documentation: https://dataplane.app/docs/ <br />
Demo: https://dataplane.app/demo <br />
Recipes: https://dataplane.app/recipes/ <br />


## Quick start with Docker
Requires Docker engine installed - https://docs.docker.com/engine/install/ <br />
Download the quick start docker compose file
```shell
curl -LfO 'https://raw.githubusercontent.com/dataplane-app/dataplane/main/quick-start/docker-compose.yaml'
```
Run docker compose
```shell
docker-compose up
```
For first time setup, follow the get started process at: http://localhost:9001/webapp/get-started <br />

To use Dataplane, go to http://localhost:9001/webapp/ <br />
Docker releases: https://hub.docker.com/u/dataplane <br />


## Develop Dataplane code
There is a containerised development environment setup for VS code.

To get started with a development setup follow these steps
1. Install Remote Development in VS Code - extension id: ms-vscode-remote.vscode-remote-extensionpack
2. Click on the green section with two chevrons bottom left corner of VS code "Open a remote window"
3. Ensure Docker is running
4. Click on "Reopen in Container" 
5. To work outside of the container, click on the green section again and select "Reopen Folder Locally"


## License

The project published in this git repo is released under the Source Available License - Business Source License 1.1 (BSL). The license was chosen to discourage cloud providers offering this project as a data platform service. If you would like to offer Dataplane as a service, we are open to the conversation, come speak to us. For the rest of you (99.999%) who are using the software for your own personal or business needs, you can use the software freely where these restrictions will not apply. 

Thanks to Vectorized (https://vectorized.io/blog/open-source/), CockroachDB and Mariadb for researching and developing the Business Source License. We share the same views to strike a balance between making software open to the community while being protected from unfair practices that aim to commercially benefit without giving back to the community. 
