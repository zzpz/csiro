# csiro

[![CSIRO app container](https://github.com/zzpz/csiro/actions/workflows/docker.yml/badge.svg)](https://github.com/zzpz/csiro/actions/workflows/docker.yml)

## Building and running locally

Build the node app

```bash
npm run build
```

Build the docker image

```bash
docker build . -t csiro-node-app
```

Run using qualified path input/output folders mounted in image

```bash
INPUT_FOLDER=$(pwd)/input
OUTPUT_FOLDER=$(pwd)/output
docker run -ti -v ${INPUT_FOLDER}:/app/input -v ${OUTPUT_FOLDER}:/app/output csiro-node-app
```

or Run using and mount input/output from current directory:

```bash
docker run -ti -v $(pwd)/input:/app/input -v $(pwd)/output:/app/output csiro-node-app
```
