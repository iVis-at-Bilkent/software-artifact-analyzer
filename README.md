# Software Artifact Analyzer

Software Artifact Analyzer (SAA) was built on a [fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) of the [Visuall](https://github.com/ugurdogrusoz/visuall) toolkit to visually analyze varying software artifacts including source code files, pull requests, issues, and commits, as well as their links and their relationships with developers in a software project.

![Screenshot](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/4118240f-9942-4cc5-a61d-e268bf3740b3)

# Demo
A sample demo deployment can be found [here](http://saa.cs.bilkent.edu.tr/).

## License

SAA and its base library Visu*all* are open-source repositories but **not** free software for commercial use. Please contact [i-Vis Research Lab](http://www.cs.bilkent.edu.tr/~ivis/) and [BILSEN Research Group](https://bilsen.cs.bilkent.edu.tr/) for terms of use of this software.

## Key Features

- **Context Menu**: Implemented using the [cytoscape.js-context-menus](https://github.com/iVis-at-Bilkent/cytoscape.js-context-menus) library, the context menu is node-specific, allowing users to perform operations tailored to each node type. Relation-based queries enable users to reveal connections between different node types.
![Context Menu](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/e300f599-0025-41c0-b32f-d478f04f9585)

- **Grouping Nodes**: SAA facilitates the grouping of nodes based on developers, enhancing visualization to understand relationships and dynamics within a software project.

- **Reviewer Recommendation**: Utilizing the RSTrace+ [1] algorithm, SAA assists in making reviewer assignments, offering a visual representation of analysis results to boost confidence in decision-making.

![Reviewer Recommendation](https://github.com/iVis-at-Bilkent/software-artifact-analyzer/assets/59064089/e363c472-c631-448a-9a60-9c9e55bc706c)

- **Bug Tracking Process Anomaly Detection**: SAA detects 11 types of bug-tracking process anomalies, as categorized by Qamar et al. [2], contributing to process evaluation and anomaly prevention.

- **Reporting Module**: SAA allows users to report analysis results or observations directly on GitHub or Jira platforms, promoting seamless integration and practicality. Users can submit reports as comments under pull requests in GitHub or issue comments in Jira, enhancing collaboration and communication.

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

A User Guide for SAA can be found [here](https://docs.google.com/document/d/1MHoBk2O2AREYiKwqZuDkHLkdlWwUkYMHzeuugqnVxFY/edit?usp=sharing). 

## Developer Guide

A Developer Guide for SAA can be found [here](https://docs.google.com/document/d/1dIasoHNoGYy6klZOnmUMzOE7RvM-fN7DOcEf7w9jS70/edit?usp=sharing). 

## Credits
[Visuall](https://github.com/ugurdogrusoz/visuall) and dependencies including cytoscape.js.

## About
SAA is being developed by [i-Vis Research Lab](http://www.cs.bilkent.edu.tr/~ivis/)  and [BILSEN Research Group](https://bilsen.cs.bilkent.edu.tr/)  at Bilkent University.

## Team
[Lara Merdol](https://github.com/LaraMerdol), [Eray Tüzün](https://github.com/eraytuzun) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz)

## Maintenance
You might want to get updates from [the original Visuall repository](https://github.com/ugurdogrusoz/visuall). To do that, first, add the base project as a remote repo using `git remote add base https://github.com/ugurdogrusoz/visuall.git`,
then fetch commits for that project with `git fetch base` and then transfer changes of commits using a command such as `git cherry-pick fe75f -n`.
