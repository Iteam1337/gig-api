FROM node:10.12-alpine

WORKDIR /app

ENV \
  port=${port:-4004} \
  environment=${environment:-develop} \
  database__user=${database__user:-user} \
  database__password=${database__password:-password} \
  database__database=${database__database:-gig} \
  database__host=${database__host:-localhost} \
  database__port=${database__port:-5432} \
  database__timeout=${database__timeout:-30000} \
  elastic__host=${elastic__host:-localhost:9200} \
  elastic__index_prefix=${elastic__index_prefix:-} \
  graphql__jobskills=${graphql__jobskills:-https://api.jobskills.se/graphql}

COPY package* ./
RUN npm install -s --only=production

COPY bin ./bin
COPY migrations ./migrations
COPY lib ./lib

CMD npm start













