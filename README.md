# Gig
Gigs API


## Setup

Make sure docker is running on your machine.

Then use [Docker compose](https://docs.docker.com/compose/install/)

`$ docker-compose up` This will run postgres in an container.

First you need an enivroment variable for the migrations to run:

`export DATABASE_URL=postgres://user:password@localhost/gig`

Finally start the API:

`npm start` - Runs migrations and starts the API

### NPM commands

`npm start`: Runs migration and starts the API

`npm start:server`: Starts the API without migrations

`npm migrate`: Runs migrations only

`npm migrate:down`: Revert migration

`migrate:create`: Create migration


### Post Gig-jobs to our API:

1. First you'll need to contact us to get a clientId and a clientSecret.
2. Add `x-client-id:${clientId}` and `x-client-secret:${clientSecret}` to your request headers
3. Post following model:

#### POST /jobs
```
[{
  "type": "Gig", // Can be Job or Gig
  "company": "Foo", // The company that wants to hire
  "title": "Developer for short project", // Title that will show up in the listing
  "preamble": "Lorem ipsum dolor sit amet", // Short information text that will show up in the listing
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", // Long text with job description
  "language": "sv", // Language sv/en/ar
  "link": "https://foo.com", // Link to the job
  "contact": "https://foo.com", // Link to contact
  "pay": { "fixed": 1500 }, // A JSON where you can list fixed/hourlyPay
  "categories": { "skills": ["38cf67f6-cdca-4df5-aea3-91c863192e3c"] }, // JSON where you map with AF-taxonomy
  "startDate": "2018-05-23T22:00:00.000Z", // When the job start, ISO-string
  "endDate": "2018-05-24T22:00:00.000Z", // When the job ends, ISO-string
  "listedDate": "2018-05-23T09:41:49.000Z", // The day you listed the job
  "source": "Iteam", // Where you found the job, leave null if you're the source, will get from token.
  "sourceId": "1234", // The identifier from the source.
  "longitude": 18.02921, // longitude of the job
  "latitude": 59.33611, // latitutde of the job
  "address": "foo, Stockholm" // the text of the address that will show up in the listing
}
```


### Get jobs from the gig-api:

#### GET /jobs?page=2&pageLimit=2

```
[{
  "type": "Gig", // Can be Job or Gig
  "company": "Foo", // The company that wants to hire
  "title": "Developer for short project", // Title that will show up in the listing
  "preamble": "Lorem ipsum dolor sit amet", // Short information text that will show up in the listing
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", // Long text with job description
  "language": "sv", // Language sv/en/ar
  "link": "https://foo.com", // Link to the job
  "contact": "https://foo.com", // Link to contact
  "pay": { "fixed": 1500 }, // A JSON where you can list fixed/hourlyPay
  "categories": { "skills": ["38cf67f6-cdca-4df5-aea3-91c863192e3c"] }, // JSON where you map with AF-taxonomy
  "startDate": "2018-05-23T22:00:00.000Z", // When the job start, ISO-string
  "endDate": "2018-05-24T22:00:00.000Z", // When the job ends, ISO-string
  "listedDate": "2018-05-23T09:41:49.000Z", // The day you listed the job
  "source": "Iteam", // Where you found the job, leave null if you're the source, will get from token.
  "sourceId": "1234", // The identifier from the source.
  "longitude": 18.02921, // longitude of the job
  "latitude": 59.33611, // latitude of the job
  "address": "foo, Stockholm", // the text of the address that will show up in the listing
  "createdAt": "2018-05-23T22:00:00.000Z" // When it was posted to gig
  "entryBy": "Iteam" // Poster of the job
}]
```

## Please feel free to leave us feedback on the model/Open issues/Open PRs
