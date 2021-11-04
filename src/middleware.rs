use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{ self, Header, Status };
use rocket::{Request, Response};

pub struct Cors;

#[async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to requests",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new(
            "Access-Control-Allow-Origin",
            "*",
        ));

        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "GET, POST",
        ));

        response.set_header(Header::new(
            "Access-Control-Allow-Headers",
            "*",
        ));

        response.set_header(Header::new(
            "Access-Control-Allow-Credentials",
            "true",
        ));

        // If this was an OPTIONS request and no route can be found, we should turn this
        // into a HTTP 204 with no content body.
        // This allows the user to not have to specify an OPTIONS route for everything.
        if request.method() == http::Method::Options && request.route().is_none() {
            response.set_status(Status::NoContent);
            let _ = response.body_mut().take();
        }
    }
}
