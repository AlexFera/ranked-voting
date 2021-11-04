use jsonwebtoken::errors::ErrorKind;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use rocket::serde::{Deserialize, Serialize};

static SECRET: &[u8] = b"Rust";

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Claims {
    pub user_id: i64,
    pub sub: String,
    pub company: String,
    pub exp: usize,
}

pub fn get_token(user_id: i64) -> String {
    let claims = Claims {
        sub: "b@b.com".to_owned(),
        company: "ACME".to_owned(),
        exp: 10000000000,
        user_id,
    };

    match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(SECRET),
    ) {
        Ok(t) => t,
        Err(_) => panic!(), // in practice you would return the error
    }
}

pub fn decode_token(token: &str) -> Claims {
    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(SECRET),
        &Validation::new(Algorithm::HS256),
    ) {
        Ok(c) => c,
        Err(err) => match *err.kind() {
            ErrorKind::InvalidToken => panic!("Token is invalid"), // Example on how to handle a specific error
            ErrorKind::InvalidIssuer => panic!("Issuer is invalid"), // Example on how to handle a specific error
            _ => panic!("Invalid token error {}", err),
        },
    };

    token_data.claims
}
