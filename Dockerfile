FROM openjdk:8

ARG tinkerpopVersion

WORKDIR /opt
RUN wget https://www.apache.org/dist/tinkerpop/$tinkerpopVersion/apache-tinkerpop-gremlin-server-$tinkerpopVersion-bin.zip
RUN unzip ./apache-tinkerpop-gremlin-server-$tinkerpopVersion-bin.zip
WORKDIR /opt/apache-tinkerpop-gremlin-server-$tinkerpopVersion
RUN sed -i -e 's/localhost/0.0.0.0/' conf/*.yaml

ENTRYPOINT ["bin/gremlin-server.sh"]
CMD ["conf/gremlin-server-modern.yaml"]