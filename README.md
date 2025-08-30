# Update docker image

Once modifications had been made to the projet, you want to update docker image.

## Create new docker image

Simply run :

```bash
docker build . -t louiscorbet/blogseed:latest
```

## Test it

Then, you can test it via Docker Desktop for example --> go in `Volumes` and you can see that the image had just been created. You can launch it with this command :

```bash
docker run -p 3000:3000 --env-file .env louiscorbet/blogseed:latest
```

and a new container will be created in docker Desktop, in `Containers`. You can access your new application to `localhost:3000`.

## Push it to docker hub

```bash
docker push louiscorbet/blogseed:latest
```

Your image is up to date, and can be pulled from anywhere now

## Update existing container

To update an existing container, remove it, pull new image, and recreate it. Volume will not be impacted :

```bash
docker stop my_website
docker rm my_website
docker pull louiscorbet/blogseed:latest
docker run -d --name my_website --network web --user 1001:1001 --env-file /opt/my_website/secrets/my_website.env  -v my_website-data:/app/data  louiscorbet/blogseed:latest
```

# Deploy a new blog

## The server is new : configure it

### 1/3 - Install every docker dependency you need :

```bash
curl -fsSL https://get.docker.com | sh
```

To simplify deployments and handle SSL, we will use a docker network, and manage it with `caddy` : a tool that will handle proxy and SSL certificates automatically.

### 2/3 - Create a docker network for caddy

```bash
docker network create web
```

### 3/3 - Create config files

Go to `/opt/caddy` and create :
`docker-compose.yml` with this :

```yml
services:
  caddy:
    image: caddy:2
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data # certificats Let’s Encrypt
      - caddy_config:/config
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
    external: true
```

and `Caddyfile` with this :

```caddy
{
  email you@example.com   # email pour Let's Encrypt (enter any email, but has to be a real email because it doesn't work if not)
}

nomdedomaine1.com, www.nomdedomaine1.com { # website 1
  encode gzip
  reverse_proxy my-next-app-1:3000 # keep 3000, no need to change
}

nomdedomaine2.com, www.nomdedomaine2.com { # website 2
  encode gzip
  reverse_proxy my-next-app-2:3000 # keep 3000, no need to change
}
```

Now, you are ready to perform a deployment

## The serveur is configured : perform a deployment

Here, we assume that the server is already configured (as in previous section) and we just want to perform a new deployment

### 1/4 - Add redirection for caddy

Go to `/opt/caddy/Caddyfile` and copy/paste this bloc for your new website :

```caddy
new-domain.com, www.new-domain.com { # bloc for new-website
  encode gzip
  reverse_proxy my-next-app-3:3000 # keep 3000, no need to change
}
```

### 2/4 - Create a `.env` file for our new website

Got to `/opt/website_name/secrets` and create `website_name.env`

```bash
# Site identity
# displayed in header, not editable
SITE_NAME=BlogSeed
# used for SEO
SITE_URL=https://new-website.com
# used for SEO
SITE_LOCALE_DEFAULT=fr_FR

# used for admin page
ADMIN_USER=admin
# used for admin page
ADMIN_PASS=admin
```

### 3/4 - Create a new docker container with our image

You may be asked to authenticate when running this command

```bash
docker run -d --name my_website --network web --user 1001:1001 --env-file /opt/my_website/secrets/my_website.env  -v my_website-data:/app/data  louiscorbet/blogseed:latest
```

- `--name` to give a name to the container
- `--network` to put container on the same network to caddy
- `--user` : the value `0:0` allow container to write files in data folder and avoid permission errors
- `--env-file` to bind the `.env` file
- `-v` to create volumes to store data outside the container --> we can remove and recreate the container without deleting data

### 4/4 - reload caddy to take changes in consideration

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Your site is ready.
