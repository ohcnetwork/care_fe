
<p align="center"><img style="height:150px;" src="https://cdn.coronasafe.network/care_logo.svg" alt="CARE Logo" /></p>
<h3 align="center"><a href="https://care.coronasafe.in/" target="_blank">🚀 Staging Deploy</a></h3>
<p align="center"><img src="https://api.netlify.com/api/v1/badges/fd123f42-ef65-448c-9b03-39959d60e60b/deploy-status"></p>
<h2></h2>


[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/0)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/0)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/1)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/1)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/2)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/2)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/3)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/3)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/4)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/4)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/5)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/5)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/6)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/6)[![](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/images/7)](https://sourcerer.io/fame/tomahawk-pilot/coronasafe/care_fe/links/7)

[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/dashboard?id=coronasafe_care_fe)

![Code scanning - action](https://github.com/coronasafe/care_fe/workflows/Code%20scanning%20-%20action/badge.svg)
![OSSAR](https://github.com/coronasafe/care_fe/workflows/OSSAR/badge.svg)
[![Cypress Tests](https://github.com/coronasafe/care_fe/actions/workflows/cypress.yaml/badge.svg)](https://github.com/coronasafe/care_fe/actions/workflows/cypress.yaml)
![Staging Release](https://github.com/coronasafe/care_fe/workflows/CARE%20Develop%20Registry/badge.svg)
![Production Release](https://github.com/coronasafe/care_fe/workflows/Production%20Release/badge.svg)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/200482ab117e4b5397ff3f5ae5719aa2)](https://www.codacy.com/gh/coronasafe/care_fe?utm_source=github.com&utm_medium=referral&utm_content=coronasafe/care_fe&utm_campaign=Badge_Grade)
[![CircleCI](https://circleci.com/gh/coronasafe/care_fe.svg?style=svg)](https://circleci.com/gh/coronasafe/care_fe)
[![Maintainability](https://api.codeclimate.com/v1/badges/f1438f693aa459805301/maintainability)](https://codeclimate.com/github/coronasafe/care_fe/maintainability)

Auto deployed to https://care.coronasafe.in for `develop` branch.
All pull requests has preview builds powered by [Netlify](https://netlify.com).

## Let's contribute?

- Comment on the issue if you are willing to take it up, and link the pull request with the issue.
- Tag `@coronasafe/code-reviewers` for faster resolution.
- Attach screenshots in the pull requests shwoing the changes made in the UI.

### Getting started

#### Install the required dependencies
```sh
npm install --legacy-peer-deps
```

#### Run the app in development mode
```sh
npm run start
```
Once the development server has started, open [http://localhost:4000](http://localhost:4000) in your browser.<br />
The page will be automatically reloaded when you make edits and save<br />
You will also see any lint errors in the console.<br />

#### Staging API Credentials

Authenticate to staging API with any of the following credentials

```yaml
- username:  devdistrictadmin
  password:  Coronasafe@123
  role:      District Admin
  
- username:  devstaff
  password:  Coronasafe@123
  role:      Staff
```

#### Run cypress tests
Ensure that the development server is running and then run the cypress tests in either of the ways described below.

```sh
$ npm run cypress:run        # To run all tests in headless mode.
$ npm run cypress:run:gui    # To run all tests in headed mode.
$ npm run cypress:open       # To debug and run tests individually.
```

- Failed test screenshots are saved in `cypress/screenshots`
- All test videos are saved in `cypress/videos`

#### Staging API Documentation

https://careapi.coronasafe.in/swagger/

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run start:Dev`

Starts a production http-server in local to run the project with Service worker

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

