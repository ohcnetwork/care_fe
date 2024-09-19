<a href="https://ohc.network/">
  <p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.ohc.network/light-logo.svg">
      <img alt="CARE Logo" src="https://user-images.githubusercontent.com/25143503/193396107-27e0d587-b195-4e95-a795-5d0663d5cd81.svg">
    </picture>
  </p>
</a>
<p align="center"><b>Our goal is to continuously improve the quality and accessibility of public healthcare services using digital tools.</b></p>
<h2></h2>
<h3 align="center"><a href="https://care.ohc.network" target="_blank">🚀 Staging Deploy</a></h3>
<p align="center"><img src="https://api.netlify.com/api/v1/badges/fd123f42-ef65-448c-9b03-39959d60e60b/deploy-status"></p>
<p align="center">Auto deployed to <a href="https://care.ohc.network/">care.ohc.network</a> for <code>develop</code> branch. All pull requests have preview builds powered by <a href="https://netlify.com">Netlify</a>.</p>

[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/0)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/0)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/1)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/1)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/2)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/2)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/3)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/3)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/4)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/4)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/5)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/5)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/6)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/6)[![](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/images/7)](https://sourcerer.io/fame/tomahawk-pilot/ohcnetwork/care_fe/links/7)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=coronasafe_care_fe&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=coronasafe_care_fe)
![Code scanning - action](https://github.com/ohcnetwork/care_fe/workflows/Code%20scanning%20-%20action/badge.svg)
![OSSAR](https://github.com/ohcnetwork/care_fe/workflows/OSSAR/badge.svg)
[![Cypress Tests](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/wf7d2m/develop&style=flat&logo=cypress)](https://cloud.cypress.io/projects/wf7d2m/runs)
![Staging Release](https://github.com/ohcnetwork/care_fe/workflows/CARE%20Develop%20Registry/badge.svg)
![Production Release](https://github.com/ohcnetwork/care_fe/workflows/Production%20Release/badge.svg)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/200482ab117e4b5397ff3f5ae5719aa2)](https://www.codacy.com/gh/ohcnetwork/care_fe?utm_source=github.com&utm_medium=referral&utm_content=ohcnetwork/care_fe&utm_campaign=Badge_Grade)
[![CircleCI](https://circleci.com/gh/ohcnetwork/care_fe.svg?style=svg)](https://circleci.com/gh/ohcnetwork/care_fe)
[![Maintainability](https://api.codeclimate.com/v1/badges/f1438f693aa459805301/maintainability)](https://codeclimate.com/github/ohcnetwork/care_fe/maintainability)

## Getting started

- 💬 Comment on the issue if you are willing to take it up, and link the pull request with the issue.
- 🏷️ Tag `@ohcnetwork/care-fe-code-reviewers` for faster resolution.
- 📸 Attach screenshots in the pull requests showing the changes made in the UI.

#### Install the required dependencies

```sh
npm install
```

#### 🏃 Run the app in development mode

```sh
npm run dev
```

Once the development server has started, open [localhost:4000](http://localhost:4000) in your browser. The page will be automatically reloaded when you make edits and save. You will also see any lint errors in the console.

#### 🔑 Staging API Credentials

Authenticate to staging API with any of the following credentials

```yaml
- username: dev-districtadmin
  password: Coronasafe@123
  role: District Admin

- username: staffdev
  password: Coronasafe@123
  role: Nurse

- username: doctordev
  password: Coronasafe@123
  role: Doctor
```

#### Contributing to CARE

- Create a branch with branch name of the format `issues/{issue#}/{short-name}` (example `issues/7001/edit-prescriptions`) from the latest [`develop`](https://github.com/ohcnetwork/care_fe/tree/develop) branch when starting to work on an issue.
- Once the changes are pushed to the branch, make a pull request with a meaningful title (example: "💊 Adds support for editing prescriptions" #6369)
- Ensure the issue number is mentioned in the PR with a closing tag by following the PR body template. (Refer: [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword))
- Once the code review is done, the PR will be marked with a "Needs Testing" label where it'll be queued for QA testing.
- Once tested, the PR would be marked with a "Tested" label and would be queued for merge.

### Testing

To ensure the quality of our pull requests, we use a variety of tools:

- **Automated E2E Testing:** We use Cypress for end-to-end testing to automatically verify the functionality and performance of our code.
- **Manual Real Device Testing:** We use BrowserStack to manually test our code on real devices, ensuring compatibility and functionality across different platforms and browsers.

#### 🧪 Run cypress tests

To run cypress tests locally, you'll need to setup the backend to run locally and load dummy data required for cypress to the database. See [docs](https://github.com/ohcnetwork/care#self-hosting).

Once backend is running locally, you'll have to ensure your local front-end is connected to local backend, by setting the `REACT_CARE_API_URL` env.

```env
#.env
REACT_CARE_API_URL=http://127.0.0.1:9000
```

Once done, start the development server by running

```sh
npm run dev
```

Once development server is running, then run the cypress tests in either of the ways described below.

```sh
npm run cypress:run        # To run all tests in headless mode.
```

```sh
npm run cypress:run:gui    # To run all tests in headed mode.
```

```sh
npm run cypress:open       # To debug and run tests individually.
```

- Failed test screenshots are saved in `cypress/screenshots`
- All test videos are saved in `cypress/videos`

## 📖 Documentations

- [CARE Documentation](https://docs.ohc.network/docs/care)
- [Swagger API Documentation](https://careapi.ohc.network/swagger/)
- [Testing Documentation](https://docs.coronasafe.network/care-testing-documentation/)

## 🚀 Production

#### Build the app for production

```sh
npm run build
```

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

#### Start a production `http-server`

```sh
npm run preview
```

Starts a production http-server in local to run the project with Service worker.
The build is minified and the filenames include the hashes.

**🚀 Your app is ready to be deployed!**
