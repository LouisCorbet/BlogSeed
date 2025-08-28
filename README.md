# Deploy a new blog

- Go to your server
- If it's new and clean, install all necessary dependancies for `docker` using this command only :

```bash
curl -fsSL https://get.docker.com | sh
```

- Authenticate to docker with this command :

```bash
docker login
```

- Run blogseed docker image :

```bash
docker run -d -p 3000:3000 louiscorbet/blogseed:latest
```

Each time this command is executed, a new docker container is created, and a new blog is deployed.
