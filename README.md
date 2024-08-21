# Hearth

Welcome to the hearth! The soot monorepo.

## Getting Started

First, we use [git-lfs] to store large files in the monorepo, so please install
it using:

```sh
git lfs install
```

Note that you may need to install git lfs on your system using:

```sh
# OSX
brew install git-lfs

# Ubuntu
sudo apt-get install git-lfs
```

Once installed. subsequent git pulls will use lfs to locate large files.
However, if you've already pulled, you can back-date your repo with:

```sh
git lfs pull
```

[git-lfs]: https://git-lfs.com/

Second, you need to manually install a few native binaries required by our
packages:

1. Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Install [Docker](https://docs.docker.com/engine/install/). Make sure to
   install the server instead of docker desktop.
3. Install [tfswitch](https://tfswitch.warrensbox.com/Install/)
4. Install [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/)
5. Install [basis_universal](https://github.com/BinomialLLC/basis_universal#command-line-compression-tool).
   Note that we use version [1.16.4](https://github.com/BinomialLLC/basis_universal/releases/tag/1.16.4).
   After installing, you may need to move basisu to a location that is on your
   bash path. We recommend moving the file to ~/bin/
6. Install [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and authenticate.

Third, you can install the rest of our dependencies using `npm`:

```sh
nvm use
npm run initialize
```

NOTE: all future commands assume you have run `nvm use` at least once during
your current bash session. It is possible to run `nvm use` automatically for
any directory that has a `.nvmrc`. Take a look at the [nvm README](https://github.com/nvm-sh/nvm#deeper-shell-integration)
-- it is a very easy copy paste, and we highly recommend you do this.

Afterwards you should verify that everything installed correctly by building the
project. This has the added benefit of populating our build caches which is
necessary for running incremental builds. It is also a necessary step to
ensure that packages that depend on other hearth packages work correctly.

```sh
npm run build
```

If that worked, we can start the local development workflow! First, our backends
require emulation of AWS locally (we achieve this with
[localstack](https://localstack.cloud/)). You can achieve this by running:

```sh
./localstack/start.sh
```

Note that if you ever make changes to the localstack configs, or if your
machine reboots, you can rerun `start.sh` to refresh the localstack state.

Second, `cd` into the package of your choosing and they'll all support a number
of npm scripts to aid developing that specific package. For most packages this
is either:

```sh
npm start

# or

npm run build
```

> Note that the environment variable `SOOT_LOG_PRETTY_PRINT=true` can be used to
> make our log statements more readable in developer environments. I suggest
> adding `export SOOT_LOG_PRETTY_PRINT=true` to your bashrc.

Frontend: http://localhost:5002
API: http://localhost:8082

## Running the entire stack locally, clean build

If you want to run a clean, local version of SOOT, do the following:

1. Bring down localstack using `./localstack/end.sh`. Sometimes there will be a dangling task that needs to be killed; this can be done using `docker ps` to find the process PID, followed by `docker kill <pid>`
2. Bring localstack back up using `./localstack/start.sh`
3. Run `npm run start:backend` in the hearth root.
4. In a new terminal pane, clone [go/pyre](go/pyre) and follow the setup and run-backend steps there.
5. In a new terminal pane, go to `hearth/packages/binaries/ui-v2` and run `npm run start:web:local`.

And you're done! If done correctly, you should be able to access the UI at `localhost:5004`. Since you're running everything locally, you can analyze your database using `mongosh` in a terminal pane, or check out the opensearch index using GETs to `http://localhost:4566/opensearch/us-east-1/localsoot/`.

## Electron

To open the app in desktop app form using Electron, run

```
npm run electron_start
```

To build an executable using Electron, run

```
npm run electron_make
```

## Code Quality

Each package as well as the root package support the commands `lint` and
`format`. For former will check for style conformance, the latter will
auto-format your code to comply with the linter. Please auto-format all code
before committing.

```
npm run format
```

## Adding Packages

To add a new package make a new folder in `packages/`. After that you can do
what you want! Typically you'll need:

```
my-package/
  package.json
  README.md
  eslint.config.js
  prettier.config.js
```

## Adding Dependencies

Unfortunately the lerna package syntax often conflicts with npm package syntax
making `npm install` break for many packages. Instead prefer to manually add
packages to `your-package/package.json` and run `npm run refresh` at root to
inspect and install all new monorepo dependencies. You may also need to add
the external dependency to the rollup config.

Note: if you add dependencies on other hearth packages, you need to be sure
that you do one of the following things whenever you run the package:

- use `npx lerna run start --scope=@soot/${PACKAGE}}` at root to ensure that
  lerna properly builds all of the associated dependencies
- use `npm run build` in any of the dependency packages (especially those that
  have changes), and then use `npm run start` in your root package.
- use `npm run build:backend` to build ALL of the backend packages.

See [QA](https://groups.google.com/a/soot.com/g/qa/c/F1D844PP5gg) for more.
