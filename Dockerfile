# base image -alpine is much smaller image size
FROM node:lts-alpine3.17


# workdir
WORKDIR /app

# Copy build files to the container
COPY package.json .
COPY dist/* dist/

# Install the application dependencies
RUN npm install --omit=dev

# Set the command to run the application
CMD ["node", "dist/cli.js"]
