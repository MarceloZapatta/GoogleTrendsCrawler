# News Crawler

Application to get most trending topics on google trends and store in a database

## How to run

Install dependencies

```javascript
yarn 

//or 

npm install
```

Configure prisma

```javascript
npx prisma generate
```

Seed initial categories

```javascript
yarn seed
```

Run


```javascript
yarn start 

// or 
npm run start
```

## How to run docker

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

## Troubleshooting - Ubuntu


If you getting messages of not found libraries: 

"error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory"

Install required libraries:

``sudo apt update``

``sudo apt install -y libssn3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite.1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libcairo2 libasound2``