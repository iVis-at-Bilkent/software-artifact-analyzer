# Software Artifact Analyzer

Software Artifact Analyzer (SAA) was built on a [fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) of the [Visuall](https://github.com/ugurdogrusoz/visuall) toolkit to visually analyze varying software artifacts including source code files, pull requests, issues, and commits, as well as their links and their relationships with developers in a software project.

![Screenshot](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/4118240f-9942-4cc5-a61d-e268bf3740b3)

SAA web page, including instructions on usage and customization, may be found [here](https://ivis-at-bilkent.github.io/software-artifact-analyzer/) 

## Running a local instance

`npm install` for loading dependencies

`node style-generator.js {application description filename}` to generate customized application, this changes [styles.css](src/styles.css) and [index.html](src/index.html). Notice that the application description file is inside the `assets` folder.

`npm run ng serve` for development and debugging

`npm run serve-public` for making development server accesible on network

`npm run ng test` for unit tests

`npm run ng build` to generate a production build, `npm run build-prod` to generate a minified, uglified production build

`npm run ng build` and `npm run build-prod` commands generate files inside ***dist\ng-visuall*** folder. An HTTP server should serve these files. You should use [server.js](server.js) file to run a server with command `node server.js`. 

## Credits
[Visuall](https://github.com/ugurdogrusoz/visuall) and dependencies including cytoscape.js.

## About
SAA is being developed by [i-Vis Research Lab](http://www.cs.bilkent.edu.tr/~ivis/)  and [BILSEN Research Group](https://bilsen.cs.bilkent.edu.tr/)  at Bilkent University.

## Team
[Lara Merdol](https://github.com/LaraMerdol), [Eray Tüzün](https://github.com/eraytuzun) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz)

## Maintenance
You might want to get updates from [the original Visuall repository](https://github.com/ugurdogrusoz/visuall). To do that, first, add the base project as a remote repo using `git remote add base https://github.com/ugurdogrusoz/visuall.git`,
then fetch commits for that project with `git fetch base` and then transfer changes of commits using a command such as `git cherry-pick fe75f -n`.
