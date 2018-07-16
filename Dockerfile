FROM centos:centos7.4.1708

# Setup required system packages
RUN set -x \
    && yum install -y epel-release \
    && curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - \
    && yum install -y make nodejs \
    && yum clean all \
    && rm -rf /var/cache/yum

COPY . /usr/src/ocean-explorer
WORKDIR /usr/src/ocean-explorer

RUN set -x \
    && npm install

ENTRYPOINT ["/usr/src/ocean-explorer/docker-entrypoint.sh"]
CMD ["node", "scripts/dbbuilder.js"]
