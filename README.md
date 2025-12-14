# Software Artifact Analyzer

Software Artifact Analyzer (SAA) is a tool that uses the SAA framework [1], which was developed to quickly build visual analysis tools for software artifact graphs with the aim to improve the software development process.
A software artifact graph consists of software artifacts, including source code files, pull requests, issues, and commits, as well as their links and their relationships with developers in a software project. Analyzing these graphs provides useful insights into the development process, enabling applications such as expert or reviewer recommendations and detecting process anomalies.

SAA web page, including a demo, a video tutorial, and instructions on usage & customization, may be found [here](https://ivis-at-bilkent.github.io/software-artifact-analyzer/).

![Screenshot](https://github.com/user-attachments/assets/baa7d0b3-b39b-4efe-b8a1-bce5119958ea)

SAA was built on a [fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) of the [Visuall](https://github.com/ugurdogrusoz/visuall) toolkit.

⚠️ **Note:** To use this tool with your own data, you must create a free Neo4j account and use the **Neo4j Desktop Community Edition**. No paid subscription is required.

[1] Lara Merdol, Eray Tüzün and Ugur Dogrusoz, ["SAA: a framework for improving the software development process via visualization-based software analytics"](https://doi.org/10.1016/j.jss.2025.112589), Journal of Systems and Software, vol. 231, pp. 112589, 2026.

## License

SAA is open source and is **free for academic/non-commercial use only**. Please contact developers regarding the terms of use of this software.

## Running a local instance

`npm install` for loading dependencies

`node style-generator.js {application description filename}` to generate customized application, this changes [styles.css](src/styles.css) and [index.html](src/index.html). Notice that the application description file is inside the `assets` folder.

`npm run ng serve` for development and debugging

`npm run serve-public` for making development server accesible on network

`npm run ng test` for unit tests

`npm run ng build` to generate a production build, `npm run build-prod` to generate a minified, uglified production build

`npm run ng build` and `npm run build-prod` commands generate files inside ***dist\ng-visuall*** folder. An HTTP server should serve these files. You should use [server.js](server.js) file to run a server with command `node server.js`. 


### Run Software-Artifact-Analyzer-Configuration Repository:

`git clone https://github.com/LaraMerdol/software-artifact-analyzer-configuration.git` clone [software-artifact-analyzer-configuration](https://github.com/LaraMerdol/software-artifact-analyzer-configuration) repository.

`pip install -r requirements.txt install` loading python module dependencies

`python3 server.py` to run the Python module

`cd ui` go to UI component folder
 
`npm install`  loading dependencies

`npm run build` to generate a production build

`npm start`   to run

## Credits
[Visuall](https://github.com/ugurdogrusoz/visuall) and its dependencies including cytoscape.js.

## About
SAA is being developed by [i-Vis Research Lab](http://www.cs.bilkent.edu.tr/~ivis/)  and [BILSEN Research Group](https://bilsen.cs.bilkent.edu.tr/)  at Bilkent University.

## Team
[Lara Merdol](https://github.com/LaraMerdol), [Eray Tüzün](https://github.com/eraytuzun) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz)

## Maintenance
You might want to get updates from [the original Visuall repository](https://github.com/ugurdogrusoz/visuall). To do that, first, add the base project as a remote repo using `git remote add base https://github.com/ugurdogrusoz/visuall.git`,
then fetch commits for that project with `git fetch base` and then transfer changes of commits using a command such as `git cherry-pick fe75f -n`.
