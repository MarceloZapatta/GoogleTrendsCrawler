# News Crawler

Application to get most trending topics on google trends and store in a database

## How to run

Create the docker

``
docker-compose build
``

Run application

``
docker compose up -d
``

How to access container

``
docker exec -it futebolcrawler_mongo /bin/bash
``

``
docker exec -it futebolcrawler_puppeter /bin/bash
``