// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


//ClientId and ClientSecret should changed if application change
//DEVELOPER GUIDE
export const environment = {
  production: false,
  github: {
    clientId: "Iv23lip0BOwDDpCsQtc5",
    clientSecret: "d16b5e8bad373b1c08ecfde163531581717f9d1e"
  },
  jira: {
    clientId: "1hhyJZpRf4z9Esrk8w1SW9jSfNh4n9Ez",
    clientSecret: "ATOAPzODuZ1e_BjtO9W7M3ZR1qDlMnCVVrmtKRKOUs75X6cyFPYHiaAFKl72JUXdfeb-007822FC"
  },
  dbConfig: {
    url: 'http://ivis.cs.bilkent.edu.tr:3004/db/neo4j/tx/commit',
    username: 'neo4j',
    password: '01234567'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
