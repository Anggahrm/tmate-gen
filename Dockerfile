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
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set root password to 'root' for su access
RUN echo 'root:root' | chpasswd

# Create a user 'tmate' with passwordless sudo access
RUN useradd -m -s /bin/bash tmate && \
    echo 'tmate ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/tmate && \
    chmod 0440 /etc/sudoers.d/tmate

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
