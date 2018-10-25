FROM node:10.12-alpine

WORKDIR /app

ENV \
  PORT=${PORT:-4004} \
  ENVIRONMENT=${ENVIRONMENT:-develop} \
  DATABASE__USER=${DATABASE__USER:-user} \
  DATABASE__PASSWORD=${DATABASE__PASSWORD:-password} \
  DATABASE__DATABASE=${DATABASE__DATABASE:-gig} \
  DATABASE__HOST=${DATABASE__HOST:-localhost} \
  DATABASE__PORT=${DATABASE__PORT:-5432} \
  DATABASE__TIMEOUT=${DATABASE__TIMEOUT:-30000} \
  ELASTIC__HOST=${ELASTIC__HOST:-localhost:9200} \
  ELASTIC__INDEX_PREFIX=${ELASTIC__INDEX_PREFIX:-} \
  GRAPHQL__JOBSKILLS=${GRAPHQL__JOBSKILLS:-https://api.jobskills.se/graphql}

COPY package* ./
RUN npm install -s --only=production

COPY bin ./bin
COPY migrations ./
COPY lib ./lib

CMD npm start













