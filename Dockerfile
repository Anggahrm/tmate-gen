FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y \
    tmate \
    openssh-client \
    wget \
    curl \
    git \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
