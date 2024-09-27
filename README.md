> docker build -f Dockerfile -t gremlin-server:3.7.2 --build-arg tinkerpopVersion=3.7.2 .

> docker run -d -p 8182:8182 --name gremlin-server gremlin-server:3.7.2
