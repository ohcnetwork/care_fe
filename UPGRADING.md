---
id: upgrading
title: Upgrading Guide
sidebar_label: Upgrading
---

## Breaking changes

These are a list of changes that should be accounted for when upgrading an existing installation of Care. If you
encounter any problems while following these instructions, please [create a new issue](https://github.com/coronasafe/care_fe/issues/new/choose)
on our Github repo.

Breaking Changes before **September Minor Release v11.2** are not yet documented

#### October Minor Release v11.3

Introduced Whitelabelling with .env files. Forks that have been whitelabelled will need to refactor to use the .env files instead. We recommend injecting the .env files on build to avoid conflicts in the future
