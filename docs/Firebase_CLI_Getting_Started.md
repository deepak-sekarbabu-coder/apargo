# Firebase CLI: Getting Started for Developers

This guide provides a comprehensive introduction to the Firebase Command Line Interface (CLI) for developers who are new to the platform. Follow these steps to set up, initialize, and deploy your first Firebase project.

## 1. Prerequisites

Before you begin, ensure you have the following:

- **Google Account**: You need a Google account to sign in to Firebase.
- **Firebase Account**: Go to the [Firebase Console](https://console.firebase.google.com/) and log in with your Google account.
- **Node.js and npm**: The Firebase CLI is built on Node.js.
  - Download and install the LTS version from [nodejs.org](https://nodejs.org/).
  - Verify installation by running the following commands in your terminal:

    ```bash
    node -v
    npm -v
    ```

## 2. Installation

Install the Firebase CLI globally on your machine using `npm` (Node Package Manager). This allows you to run firebase commands from any directory.

**Command:**

```bash
npm install -g firebase-tools
```

- `npm install`: The command to install a package.
- `-g`: The flag that installs the package globally.
- `firebase-tools`: The name of the Firebase CLI package.

**Verification:**
After installation, check the version to confirm it was successful:

```bash
firebase --version
```

## 3. Authentication

To use the CLI, you must link it to your Google account.

**Command:**

```bash
firebase login
```

**What happens next:**

1. The CLI asks for permission to collect usage data (Y/n). You can choose either.
2. A browser window will open asking you to sign in with your Google account.
3. Grant the requested permissions to allow the Firebase CLI to access your projects.
4. Once successful, the terminal will display: `Success! Logged in as your.email@example.com`.

## 4. Project Initialization

Now, let's set up a Firebase project in your local directory.

**Step 1: Create a directory**
Create a folder for your project and navigate into it:

```bash
mkdir my-awesome-app
cd my-awesome-app
```

**Step 2: Initialize Firebase**
Run the initialization command:

```bash
firebase init
```

**Step 3: Follow the interactive prompts**

1. **Which Firebase features do you want to set up?**
   - Use the arrow keys to move and the **Spacebar** to select features.
   - For this guide, select: `Hosting`, `Firestore`, and `Functions`.
   - Press **Enter** to confirm.

2. **Project Setup**
   - Select **Use an existing project** (if you created one in the console) or **Create a new project**.
   - If creating new, enter a unique project ID (e.g., `my-sample-project-123`).

3. **Firestore Setup**
   - Accept the default file names for Rules and Indexes by pressing **Enter**.

4. **Functions Setup**
   - Select a language: **JavaScript** or **TypeScript**.
   - Enable ESLint? (Optional, usually **Yes**).
   - Install dependencies now? **Yes**.

5. **Hosting Setup**
   - **What do you want to use as your public directory?** Type `public` (or `dist` / `build` if using a framework).
   - **Configure as a single-page app?**
     - **Yes**: If you are building a React/Vue/Angular app (redirects all URLs to index.html).
     - **No**: If you are building a static site with multiple HTML files.
   - **Set up automatic builds and deploys with GitHub?** **No** (for now).

**Result:**
The CLI generates several files (`firebase.json`, `.firebaserc`) and folders (`public`, `functions`) in your directory.

## 5. Deployment

Once your code is ready, you can deploy your project to the live web.

**Deploy Everything:**
To deploy all initialized features (Hosting, Functions, Firestore Rules) at once:

```bash
firebase deploy
```

**Deploy Specific Features:**
If you only want to update one part of your project, use the `--only` flag.

- **Deploy only Hosting:**

  ```bash
  firebase deploy --only hosting
  ```

  _Use this when you've only changed your HTML/CSS/JS files._

- **Deploy only Functions:**

  ```bash
  firebase deploy --only functions
  ```

  _Use this when you've updated your backend code._

- **Deploy only Firestore Indexes:**

  ```bash
  firebase deploy --only firestore:indexes
  ```

  _Use this when you've added new database indexes in your `firestore.indexes.json` file._

**Output:**
The CLI will upload your files and provide a **Hosting URL** (e.g., `https://my-sample-project-123.web.app`) where your app is live.

## 6. Useful Commands

Here are a few other essential commands to help your workflow:

- **Open the Console:**

  ```bash
  firebase open
  ```

  Opens the Firebase Console for the current project in your default browser. Useful for quickly checking your database or logs.

- **Start Local Emulators:**

  ```bash
  firebase emulators:start
  ```

  Starts a local server that mimics Firebase services (Hosting, Firestore, Functions). This allows you to test your app locally at `localhost:4000` (or similar ports) without deploying to the live server.

- **List Projects:**

  ```bash
  firebase projects:list
  ```

  Displays a list of all Firebase projects associated with your logged-in account, showing their Project ID, Project Name, and Project Number.

- **Switch Projects:**

  ```bash
  firebase use <project_id>
  ```

  Switches the active project for the current directory. Useful if you have different environments (e.g., `staging` vs. `production`). Example: `firebase use my-app-staging`.
