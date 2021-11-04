use itertools::Itertools;
use rocket::serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct User {
    pub id: i64,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Item {
    pub id: i64,
    pub title: String,
    pub body: String,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Vote {
    pub user_id: i64,
    pub item_id: i64,
    pub ordinal: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Ballot {
    pub selected_items: Vec<Item>,
    pub remaining_items: Vec<Item>,
}

impl User {
    pub async fn create(username: &str) -> Result<i64, sqlx::Error> {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let id = sqlx::query!(
            r#"
            INSERT INTO users ( username )
            VALUES ( ?1 )
            "#,
            username
        )
        .execute(&pool)
        .await?
        .last_insert_rowid();

        Ok(id)
    }

    pub async fn get_by_username(username: &str) -> User {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id as "id!", username
            FROM users
            WHERE username = ?
            "#,
            username
        )
        .fetch_one(&pool)
        .await
        .expect("Cannot retrieve user!");

        user
    }

    pub async fn get_by_id(user_id: i64) -> User {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id as "id!", username
            FROM users
            WHERE id = ?
            "#,
            user_id
        )
        .fetch_one(&pool)
        .await
        .expect("Cannot retrieve user!");

        user
    }

    pub async fn get_ballot(user_id: i64) -> Ballot {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let selected_items = sqlx::query_as!(
            Item,
            r#"
            select items.id, items.title, items.body, items.done from votes
            inner join items on items.id = votes.item_id
            where votes.user_id=?
            order by votes.ordinal asc
            "#,
            user_id
        )
        .fetch_all(&pool)
        .await
        .expect("Cannot retrieve ballot!");

        let all_items = Item::get_items().await;
        let selected_ids = selected_items.iter().map(|x| x.id).collect::<Vec<i64>>();
        let remaining_items = all_items
            .into_iter()
            .filter(|item| !selected_ids.iter().any(|x| x == &item.id))
            .collect();

        Ballot {
            selected_items,
            remaining_items,
        }
    }

    pub async fn vote(user_id: i64, item_ids: Vec<i64>) {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        sqlx::query_as!(
            User,
            r#"
                DELETE
                FROM votes
                WHERE user_id = ?
                "#,
            user_id
        )
        .execute(&pool)
        .await
        .expect("Cannot retrieve user!");

        for (index, itm_id) in item_ids.iter().enumerate() {
            let ordinal = index as i64 + 1;

            sqlx::query!(
                r#"
            INSERT INTO votes (user_id, item_id, ordinal)
            VALUES ( ?1, ?2, ?3 )
            "#,
                user_id,
                itm_id,
                ordinal
            )
            .execute(&pool)
            .await
            .expect("Cannot insert vote!");
        }
    }
}

impl Item {
    pub async fn get_items() -> Vec<Item> {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let items = sqlx::query_as!(
            Item,
            r#"
            SELECT id as "id!", title, body, done
            FROM items
            WHERE done = 0
            "#,
        )
        .fetch_all(&pool)
        .await
        .expect("Cannot retrieve items!");

        items
    }

    pub async fn get_item(id: i64) -> Item {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let item = sqlx::query_as!(
            Item,
            r#"
            SELECT id as "id!", title, body, done
            FROM items
            WHERE id = ?
            "#,
            id
        )
        .fetch_one(&pool)
        .await
        .expect("Cannot retrieve item!");

        item
    }
}

impl Vote {
    pub async fn run_election() -> Option<Item> {
        let pool = SqlitePool::connect("sqlite:db/votes.db")
            .await
            .expect("Cannot connect to DB!");

        let votes = sqlx::query_as!(
            Vote,
            r#"
            SELECT user_id, item_id, ordinal
            FROM votes
            "#,
        )
        .fetch_all(&pool)
        .await
        .expect("Cannot retrieve votes!");

        let votes: Vec<Vec<_>> = votes
            .into_iter()
            .group_by(|v| v.user_id)
            .into_iter()
            .map(|(_, ballot)| ballot.into_iter().map(|v| v.item_id).collect())
            .collect();

        match rcir::run_election(&votes, rcir::MajorityMode::RemainingMajority).ok()? {
            rcir::ElectionResult::Winner(&item_id) => {
                let item = Item::get_item(item_id).await;
                Some(item)
            }
            rcir::ElectionResult::Tie(item_ids) => {
                let min_id = item_ids.into_iter().min().unwrap();
                let item = Item::get_item(*min_id).await;

                Some(item)
            }
        }
    }
}
