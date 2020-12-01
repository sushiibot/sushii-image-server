# Based on puppeteer's CI Dockerfile
# https://github.com/puppeteer/puppeteer/blob/main/.ci/node12/Dockerfile.linux

FROM node:14

RUN apt-get update && \
    apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
    libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget && \
    rm -rf /var/lib/apt/lists/*

# Run everything after as non-privileged user.

# Create workdir
WORKDIR /app

# Copy and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy and build source files
COPY . .
RUN yarn build

# Add user so we don't need --no-sandbox.
RUN groupadd -r sushii && useradd -r -g sushii -G audio,video sushii
USER sushii

EXPOSE 3000
CMD [ "node", "dist/index.js" ]
