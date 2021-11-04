# Ranked Voting

This crate is a Web App example that uses [Svelte](https://svelte.dev) as the frontend with Rust [Rocket](https://rocket.rs) as the backend API  to do [ranked choice voting](https://ballotpedia.org/Ranked-choice_voting_(RCV)).

Each user ranks the candidates according to their preference, and an election is run after each vote is cast.

The implementation is *not* secure. There is no registration mechanism. Users simply identity with a self-chosen username, so any user can change
any other's ballot simply by giving their username.
## Requirements

NodeJs - [Install](https://nodejs.org/en/download/)

Rust  - [Install](https://www.rust-lang.org/tools/install) 

Rust Nightly for the project folder

## Get started

```bash
cd ranked-voting
rustup override set nightly
npm install
```

...create a SQLite database, install SQLx CLI crate, and run the SQL migrations

```bash
sqlite3 votes.db
cargo install sqlx-cli
sqlx migrate run
```


...then start Rocket server and [Rollup](https://rollupjs.org) in two different terminals 

Terminal 1: (To run the rust server)
```bash
cargo run  
```
Terminal 2: (To build and hot reload svelte components)
```bash
npm run dev  
```

Navigate to [localhost:8000](http://localhost:5000/#/). You should see your app running. 
All svelte component live in `client` directory. Save any changes live-reloading.
All Rocket code lives in `src` directory. To rebuild Rust code use cargo run after saving your changes. 
All static files are served from `public` directory. Including the JS code compiled by Svelte Compiler.


## Building and running in production mode

To create an optimized version of the app:

```bash
npm run build
cargo build --release
```

## Built With
[Rocket](https://rocket.rs/) 

[Svelte](https://svelte.dev/)

[Bulma](https://bulma.io)