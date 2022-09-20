# Based on puppeteer's CI Dockerfile
# https://github.com/puppeteer/puppeteer/blob/main/.ci/node12/Dockerfile.linux

FROM node:16

# Chromium deps + fonts-noto
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
    fonts-noto fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

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
