// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  github: {
    clientId: "Iv1.b382b5cc7ebbd934",
    clientSecret: "4fbbce64a13dfda49ee2b75c3ab586df4b8143b3"
  },
  jira: {
    clientId: "s8vxvG5qiNGENrtsijGbheoFuihyjCa2",
    clientSecret: "ATOAaLMRtOg5cI7F-PJJ-i7u4w32JzzR3AKxq7ldQU8LBUj5FP0W-LhjLk2yfC8dMKnU790279F1"
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
