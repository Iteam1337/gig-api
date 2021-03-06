# Gig
Arbetsförmedlingen and Länsstyrelsen Stockholm invite you to participate in a pilot to supply gig jobs!
Apply or show your interest by clicking on the link below…

Contact: Maria Dalhage Digital Policy Co-ordinator Arbetsförmedlingen


## Om det här projektet
### Introduktion
Arbetsförmedlingen med partners vill genom öppen innovation undersöka hur digitalisering kan hjälpa utsatta grupper såsom asylsökande och ungdomar som varken jobbar eller därmed står utanför både utbildningssystem och arbetsmarknad. Skulle gig-jobb som riktas till asylsökande kunna utgöra ytterligare ett verktyg för att underlätta etablering och integration?
Genom att dela kunskap, data och källkod tror vi att flera kan bidra till en bättre arbetsmarknad.

### Application
[Click here to apply](https://rebeccanorn.typeform.com/to/n8paEM)

### API dokumentation
[Dokumentation för att använda API't](https://gig-docs.iteamdev.se/)

### Frågor och svar:

#### Dela gig:

#### Vad tjänar vi på att dela våra gig med er?
Vi kommer finnas på en tjänst som har en databas med 42029 arbetssökande runt om i landet, taggade med kunskaper/erfarenhet/yrkesönskemål. Utifrån den kommer användarna kunna få det sorterat på relevans utifrån kunskaperna som era gig kräver.

I framtiden vill vi även göra det möjligt att enkelt kunna ta med sig kunskaperna ifrån tjänsten så att man även kan regga sig hos er utan att behöva krångla igenom att fylla i kunskaper igen, en profilexport helt enkelt.

Ni kommer alltså få mer ansökningar som har erfarenhet som passar giget.

#### Hur kan vi som gig-plattform dela med oss av våra gig till er?
Genom att posta till vårt API, instruktioner för detta finns [här](https://gig-docs.iteamdev.se/)
Id och secret behövs för att posta, detta får ni genom att kontakta oss så skapar vi upp det åt er.
#### Hur hanterar vi språk?
Man skapar en post för varje språk och taggar den med någon av språkkoderna som finns i dokumentationen sv/en/ar etc.

#### Hur hanterar vi datum?
Det finns flera olika datum som intresserar oss, när jobbet börjar, när det slutar och när ni öppnade upp jobbet i eran plattform.

#### Hur hanterar vi plats?
Vi vill ha latitude och longitude för jobbet så kommer jobbet att synas på kartan i tjänsten, vi vill även ha adressen i textformat för listningen.

#### Hur taggar vi kategorier?
Vi använder oss utav AFs taxonomi, så för att få kategorier så behövern i mappa eran taxonomi med våran. Det ni tjänar på det är att sorteringen av relevans på det giget har en större chans att nå en arbetssökande.

#### Dela arbetssökande:

#### Vad tjänar jag på att dela arbetssökande med er?
Vi har en plattform med gig-jobb samlat ifrån flera tjänster (Just Arrived, Gigstr, Taskrunner) man skulle kunna säg att det är ett Hemnet fast för gigjobb.

#### Hur delar jag arbetssökandes kompetens med er?
Du länkar till oss med query-params med vad användaren har för kunskaper, det är viktigt att se till att arbetssökande ni delar med oss har tillstånd att jobba i Sverige.

Ni kommer behöva mappa eran taxonomi mot AFs taxonomi för det är den vi vill ha i query parametrar.

## Setup

Make sure docker is running on your machine.

Then use [Docker compose](https://docs.docker.com/compose/install/)

`$ docker-compose up` This will run postgres in an container.

`$ npm start` - Runs migrations and starts the API

### NPM commands

`$ npm start` Runs migration and starts the API

`$ npm start:server` Starts the API without migrations

`$ npm migrate` Runs migrations only

`$ npm migrate:down` Revert migration

`$ npm migrate:create` Create migration


## Please feel free to leave us feedback, open issues and open pull requests
