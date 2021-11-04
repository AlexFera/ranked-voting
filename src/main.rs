#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;

use rocket::fs::NamedFile;
use rocket::serde::json::{json, Json, Value};
use std::path::{Path, PathBuf};

mod middleware;
mod security;
mod voting;

#[post("/user", format = "json", data = "<user>")]
async fn create_user(user: Json<voting::User>) -> Value {
    if user.username.is_empty() {
        return json!({"status": "error", "reason": "Username cannot be empty"});
    }

    if let Ok(user_id) = voting::User::create(&user.username).await {
        let token = security::get_token(user_id);
        return json!({"status": "ok", "token": token});
    } else {
        let existing_user = voting::User::get_by_username(&user.username).await;
        let token = security::get_token(existing_user.id);

        json!({"status": "ok", "token": token})
    }
}

#[get("/ballot?<token>")]
async fn get_ballot(token: &str) -> Json<voting::Ballot> {
    let claims = security::decode_token(token);
    let _user = voting::User::get_by_id(claims.user_id).await;

    let ballot = voting::User::get_ballot(claims.user_id).await;

    Json(ballot)
}

#[get("/results")]
async fn get_results() -> Json<Option<voting::Item>> {
    let winner = voting::Vote::run_election().await;

    Json(winner)
}

#[post("/vote?<token>", format = "json", data = "<votes>")]
async fn vote(token: &str, votes: Json<Vec<i64>>) {
    let claims = security::decode_token(token);

    voting::User::vote(claims.user_id, votes.to_vec()).await;
}

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open("public/index.html").await.ok()
}

#[get("/build/<file..>")]
async fn build_dir(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/build/").join(file))
        .await
        .ok()
}

#[get("/css/<file..>")]
async fn css_dir(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/css/").join(file))
        .await
        .ok()
}

#[get("/icons/<file..>")]
async fn icons_dir(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/icons/").join(file))
        .await
        .ok()
}

#[launch]
async fn rocket() -> _ {
    rocket::build()
        .attach(middleware::Cors)
        .mount("/api", routes![create_user, get_ballot, get_results, vote])
        .mount("/", routes![index, build_dir, css_dir, icons_dir])
}
