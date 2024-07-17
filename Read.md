# Software Artifact Analyzer

Software Artifact Analyzer (SAA) was built on a [fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) of the repository of the tool [Visuall](https://github.com/ugurdogrusoz/visuall) to visually analyze different software artifacts, including source code files, pull requests, issues, and commits, as well as their relationships with developers in the software projects.

![Screenshot](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/4118240f-9942-4cc5-a61d-e268bf3740b3)

# Demo
A sample demo deployment can be found [here](http://saa.cs.bilkent.edu.tr/).
## Key Features

- **Context Menu**: Implemented using the [cytoscape.js-context-menus](https://github.com/iVis-at-Bilkent/cytoscape.js-context-menus) library, the context menu is node-specific, allowing users to perform operations tailored to each node type. Relation-based queries enable users to reveal connections between different node types.
![Context Menu](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/e300f599-0025-41c0-b32f-d478f04f9585)

- **Grouping Nodes**: SAA facilitates the grouping of nodes based on developers, enhancing visualization to understand relationships and dynamics within a software project.

- **Reviewer Recommendation**: Utilizing the RSTrace+ [1] algorithm, SAA assists in making reviewer assignments, offering a visual representation of analysis results to boost confidence in decision-making.

![Reviewer Recommendation](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/e363c472-c631-448a-9a60-9c9e55bc706c)

- **Bug Tracking Process Anomaly Detection**: SAA detects 11 types of bug-tracking process anomalies, as categorized by Qamar et al. [2], contributing to process evaluation and anomaly prevention.

- **Report Component**: SAA allows users to report analysis results or observations directly on GitHub or Jira platforms, promoting seamless integration and practicality. Users can submit reports as comments under pull requests in GitHub or issue comments in Jira, enhancing collaboration and communication.

![Report Component](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/7e0038e7-12d8-44ac-a13f-0d9e9c36762a)

This tool empowers developers with the ability to detect anomalies, make informed decisions, and collaborate effectively within the context of their software projects.

[1] E. Sülün, E. Tüzün, and U. Doğrusöz, “RSTrace+: Reviewer suggestion using software artifact traceability graphs,” Information and Software Technology, vol. 130, p. 106455, 2021.

[2] K. A. Qamar, E. Sülün, and E. Tüzün, “Taxonomy of bug tracking process smells: Perceptions of practitioners and an empirical analysis,” Information and Software Technology, vol. 150, p. 106972, 2022. doi:10.1016/j.infsof.2022.106972

## Running a local instance

`npm install` for loading dependencies

`node style-generator.js {application description filename}` to generate customized application, this changes [styles.css](src/styles.css) and [index.html](src/index.html). Notice that the application description file is inside the `assets` folder.

`npm run ng serve` for development and debugging

`npm run serve-public` for making development server accesible on network

`npm run ng test` for unit tests

`npm run ng build` to generate a production build, `npm run build-prod` to generate a minified, uglified production build

`npm run ng build` and `npm run build-prod` commands generate files inside ***dist\ng-visuall*** folder. An HTTP server should serve these files. You should use [server.js](server.js) file to run a server with command `node server.js`. 

## User Guide

A User Guide for the Software Artifact Analyzer can be found [here](https://docs.google.com/document/d/1MHoBk2O2AREYiKwqZuDkHLkdlWwUkYMHzeuugqnVxFY/edit?usp=sharing). 

## Credits

Icons made by [Freepik](http://www.freepik.com), 
[Daniel Bruce](http://www.flaticon.com/authors/daniel-bruce), 
[TutsPlus](http://www.flaticon.com/authors/tutsplus),
[Robin Kylander](http://www.flaticon.com/authors/robin-kylander),
[Catalin Fertu](http://www.flaticon.com/authors/catalin-fertu),
[Yannick](http://www.flaticon.com/authors/yannick),
[Icon Works](http://www.flaticon.com/authors/icon-works),
[Flaticon](http://www.flaticon.com) and licensed with 
[Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/)

Third-party libraries:
[Cytoscape.js](https://github.com/cytoscape/cytoscape.js) and many of its extensions,
[Angular](https://angular.io/),
[Google Charts](https://developers.google.com/chart/) and npm dependecies inside package.json file.

## About
Software Artifact Analyzer is being developed by [i-Vis Research Lab](http://www.cs.bilkent.edu.tr/~ivis/)  and [BILSEN Research Group](https://bilsen.cs.bilkent.edu.tr/)  at Bilkent University.
## Team
[Lara Merdol](), [Eray Tüzün](https://github.com/eraytuzun), [Uğur Doğrusöz](https://github.com/ugurdogrusoz)
## Maintenance
You might want to get updates from [the original Visuall repository](https://github.com/ugurdogrusoz/visuall). To do that, first add base project as a remote repo using `git remote add base https://github.com/ugurdogrusoz/visuall.git`,
then fetch commits for that project with `git fetch base` and then transfer changes of commits using a command such as `git cherry-pick fe75f -n`.
