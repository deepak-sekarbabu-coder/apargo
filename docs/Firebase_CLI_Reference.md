# Firebase CLI Command Reference

This document provides a quick reference for core Firebase CLI commands, organized by functional area.

## General & Setup

| Command                     | Description                                                                                         |
| :-------------------------- | :-------------------------------------------------------------------------------------------------- |
| `firebase login`            | Signs into the CLI using your Google account.                                                       |
| `firebase login:ci`         | Generates an authentication token for use in CI/CD systems.                                         |
| `firebase logout`           | Signs out of the CLI.                                                                               |
| `firebase init`             | Initializes a new Firebase project in the current directory. Follow the prompts to select features. |
| `firebase use <project_id>` | Switches the active project for the current directory (e.g., `firebase use my-prod-project`).       |
| `firebase use --add`        | Adds a new project alias (like `staging` or `prod`) to the current directory.                       |
| `firebase projects:list`    | Lists all Firebase projects associated with your account.                                           |
| `firebase open`             | Opens the Firebase Console for the current project in your browser.                                 |

## Hosting

| Command                                        | Description                                                                |
| :--------------------------------------------- | :------------------------------------------------------------------------- |
| `firebase deploy --only hosting`               | Deploys only the Hosting content (files in your public directory).         |
| `firebase hosting:channel:deploy <channel_id>` | Deploys to a preview channel with a temporary URL (great for testing PRs). |
| `firebase hosting:channel:list`                | Lists active preview channels for your site.                               |
| `firebase hosting:disable`                     | Stops serving your site and displays a "Site Not Found" message.           |

## Cloud Functions

| Command                                   | Description                                                                        |
| :---------------------------------------- | :--------------------------------------------------------------------------------- |
| `firebase deploy --only functions`        | Deploys all Cloud Functions.                                                       |
| `firebase deploy --only functions:<name>` | Deploys a specific function by name.                                               |
| `firebase functions:log`                  | Streams logs from your running Cloud Functions to the terminal.                    |
| `firebase functions:shell`                | Starts an interactive Node.js shell for invoking functions locally with test data. |

## Firestore & Database

| Command                                    | Description                                                           |
| :----------------------------------------- | :-------------------------------------------------------------------- |
| `firebase deploy --only firestore:rules`   | Deploys only Firestore security rules.                                |
| `firebase deploy --only firestore:indexes` | Deploys only Firestore indexes (defined in `firestore.indexes.json`). |
| `firebase firestore:delete <path>`         | Deletes data from Cloud Firestore at the specified path.              |
| `firebase database:get <path>`             | Fetches data from the Realtime Database at a specific path.           |
| `firebase database:push <path> [data]`     | Pushes new data to a list in the Realtime Database.                   |

## Emulators (Local Development)

| Command                                     | Description                                                                               |
| :------------------------------------------ | :---------------------------------------------------------------------------------------- |
| `firebase emulators:start`                  | Starts local emulators for all configured services (Hosting, Functions, Firestore, etc.). |
| `firebase emulators:start --only <service>` | Starts emulators for specific services (e.g., `--only firestore`).                        |
| `firebase emulators:exec "<script>"`        | Starts emulators, runs a test script, and then shuts down the emulators.                  |
| `firebase emulators:export <dir>`           | Exports data from running emulators to a directory.                                       |
| `firebase emulators:start --import <dir>`   | Starts emulators and imports previously exported data.                                    |

## Management & Utility

| Command                               | Description                                                 |
| :------------------------------------ | :---------------------------------------------------------- |
| `firebase help`                       | Displays help information for the CLI.                      |
| `firebase <command> --help`           | Displays help for a specific command.                       |
| `firebase --version`                  | Checks the currently installed version of the Firebase CLI. |
| `firebase ext:install <extension_id>` | Installs a Firebase Extension into your project.            |
