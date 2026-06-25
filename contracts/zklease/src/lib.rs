#![no_std]
#![allow(deprecated)]

mod test;
mod types;
mod verifier;

use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec,
};

use crate::types::{Bet, ContractError, Credential, DataKey, Game, GameState, MoveCommit, Prediction};
use crate::verifier::UltraHonkVerifier;

#[contract]
pub struct ZKLease;

#[contractimpl]
impl ZKLease {
    pub fn initialize(env: Env, admin: Address, verifier: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Threshold, &0u128);
        env.storage().instance().set(&DataKey::CredentialCounter, &0u64);
        env.storage().instance().set(&DataKey::GameCounter, &0u64);
        env.storage().instance().set(&DataKey::PredictionCounter, &0u64);

        env.events()
            .publish((symbol_short!("init"),), (admin, verifier));
    }

    pub fn verify_proof(env: Env, proof: Bytes, public_inputs: Vec<Bytes>) -> bool {
        UltraHonkVerifier::verify_ultra_honk_proof(&env, proof, public_inputs)
    }

    pub fn grant_credential(
        env: Env,
        to: Address,
        threshold: u128,
        proof: Bytes,
    ) -> Result<u64, ContractError> {
        to.require_auth();

        let current: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Threshold)
            .unwrap_or(0);
        if threshold < current {
            return Err(ContractError::InvalidThreshold);
        }

        let inputs = Vec::new(&env);
        if !UltraHonkVerifier::verify_ultra_honk_proof(&env, proof, inputs) {
            return Err(ContractError::InvalidProof);
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CredentialCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::CredentialCounter, &counter);

        let credential = Credential {
            owner: to.clone(),
            threshold,
            verification_timestamp: env.ledger().timestamp(),
            network: Symbol::new(&env, "zklease"),
            is_active: true,
        };
        env.storage()
            .instance()
            .set(&DataKey::Credential(counter), &credential);

        let mut owned: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerCredentials(to.clone()))
            .unwrap_or(Vec::new(&env));
        owned.push_back(counter);
        env.storage()
            .instance()
            .set(&DataKey::OwnerCredentials(to.clone()), &owned);

        env.events().publish(
            (symbol_short!("grant"), symbol_short!("cred")),
            (counter, to, threshold),
        );

        Ok(counter)
    }

    pub fn revoke_credential(env: Env, credential_id: u64) -> Result<(), ContractError> {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let mut credential: Credential = env
            .storage()
            .instance()
            .get(&DataKey::Credential(credential_id))
            .ok_or(ContractError::CredentialNotFound)?;

        if !credential.is_active {
            return Err(ContractError::CredentialNotActive);
        }

        credential.is_active = false;
        env.storage()
            .instance()
            .set(&DataKey::Credential(credential_id), &credential);

        let owner_key = DataKey::OwnerCredentials(credential.owner.clone());
        let owned: Vec<u64> = env
            .storage()
            .instance()
            .get(&owner_key)
            .unwrap_or(Vec::new(&env));
        let mut updated: Vec<u64> = Vec::new(&env);
        for id in owned.iter() {
            if id != credential_id {
                updated.push_back(id);
            }
        }
        env.storage().instance().set(&owner_key, &updated);

        env.events().publish(
            (symbol_short!("revoke"),),
            (credential_id, credential.owner),
        );

        Ok(())
    }

    pub fn get_credential(
        env: Env,
        credential_id: u64,
    ) -> Result<Credential, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Credential(credential_id))
            .ok_or(ContractError::CredentialNotFound)
    }

    pub fn get_credentials_for(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::OwnerCredentials(owner))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_threshold(env: Env) -> u128 {
        env.storage()
            .instance()
            .get(&DataKey::Threshold)
            .unwrap_or(0)
    }

    pub fn set_threshold(env: Env, new_threshold: u128) -> Result<(), ContractError> {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Threshold, &new_threshold);

        env.events()
            .publish((symbol_short!("thresh"),), (new_threshold,));

        Ok(())
    }

    pub fn deposit(env: Env, from: Address, amount: u128) {
        from.require_auth();
        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::Balance(from), &(bal + amount));
    }

    pub fn withdraw(env: Env, from: Address, amount: u128) -> Result<(), ContractError> {
        from.require_auth();
        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);
        if bal < amount {
            return Err(ContractError::InsufficientBalance);
        }
        env.storage()
            .instance()
            .set(&DataKey::Balance(from), &(bal - amount));
        Ok(())
    }

    pub fn get_balance(env: Env, address: Address) -> u128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(address))
            .unwrap_or(0)
    }

    // ────────────── RPS Game Methods ──────────────

    pub fn create_rps_game(
        env: Env,
        creator: Address,
        opponent: Address,
        entry_fee: u128,
    ) -> Result<u64, ContractError> {
        creator.require_auth();

        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(creator.clone()))
            .unwrap_or(0);
        if bal < entry_fee {
            return Err(ContractError::InsufficientBalance);
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::GameCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::GameCounter, &counter);

        let game = Game {
            id: counter,
            creator: creator.clone(),
            opponent: Some(opponent.clone()),
            entry_fee,
            move_commit_creator: MoveCommit {
                commitment: Bytes::new(&env),
                revealed_data: None,
                salt: None,
            },
            move_commit_opponent: MoveCommit {
                commitment: Bytes::new(&env),
                revealed_data: None,
                salt: None,
            },
            state: GameState::Waiting,
            winner: None,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&DataKey::Game(counter), &game);

        env.storage()
            .instance()
            .set(&DataKey::Balance(creator.clone()), &(bal - entry_fee));

        env.events().publish(
            (symbol_short!("game"), symbol_short!("create")),
            (counter, creator.clone(), opponent.clone(), entry_fee),
        );

        Ok(counter)
    }

    pub fn join_rps_game(
        env: Env,
        game_id: u64,
        joiner: Address,
    ) -> Result<(), ContractError> {
        joiner.require_auth();

        let mut game: Game = env
            .storage()
            .instance()
            .get(&DataKey::Game(game_id))
            .ok_or(ContractError::GameNotFound)?;

        if game.state != GameState::Waiting {
            return Err(ContractError::GameNotJoinable);
        }

        let opponent = game.opponent.clone().ok_or(ContractError::GameNotJoinable)?;
        if joiner != opponent {
            return Err(ContractError::Unauthorized);
        }

        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(joiner.clone()))
            .unwrap_or(0);
        if bal < game.entry_fee {
            return Err(ContractError::InsufficientBalance);
        }

        game.state = GameState::AwaitingReveal;

        env.storage()
            .instance()
            .set(&DataKey::Game(game_id), &game);

        env.storage()
            .instance()
            .set(
                &DataKey::Balance(joiner.clone()),
                &(bal - game.entry_fee),
            );

        env.events().publish(
            (symbol_short!("game"), symbol_short!("join")),
            (game_id, joiner),
        );

        Ok(())
    }

    pub fn commit_move(
        env: Env,
        game_id: u64,
        player: Address,
        commitment: Bytes,
    ) -> Result<(), ContractError> {
        player.require_auth();

        let mut game: Game = env
            .storage()
            .instance()
            .get(&DataKey::Game(game_id))
            .ok_or(ContractError::GameNotFound)?;

        if game.state != GameState::AwaitingReveal {
            return Err(ContractError::GameNotAwaitingReveal);
        }

        if player == game.creator {
            if game.move_commit_creator.commitment.len() > 0 {
                return Err(ContractError::MoveAlreadyCommitted);
            }
            game.move_commit_creator.commitment = commitment;
        } else if Some(player.clone()) == game.opponent {
            if game.move_commit_opponent.commitment.len() > 0 {
                return Err(ContractError::MoveAlreadyCommitted);
            }
            game.move_commit_opponent.commitment = commitment;
        } else {
            return Err(ContractError::NotParticipant);
        }

        env.storage()
            .instance()
            .set(&DataKey::Game(game_id), &game);

        env.events().publish(
            (symbol_short!("game"), symbol_short!("commit")),
            (game_id, player),
        );

        Ok(())
    }

    pub fn reveal_move(
        env: Env,
        game_id: u64,
        player: Address,
        move_data: u32,
        salt: Bytes,
    ) -> Result<(), ContractError> {
        player.require_auth();

        let mut game: Game = env
            .storage()
            .instance()
            .get(&DataKey::Game(game_id))
            .ok_or(ContractError::GameNotFound)?;

        if game.state != GameState::AwaitingReveal {
            return Err(ContractError::GameNotAwaitingReveal);
        }

        // Verify commitment: sha256(move_data ++ salt) == stored commitment
        let mut preimage = Bytes::new(&env);
        for b in move_data.to_le_bytes() {
            preimage.push_back(b);
        }
        preimage.append(&salt);
        let computed_hash: BytesN<32> = env.crypto().sha256(&preimage).into();
        let computed_bytes: Bytes = computed_hash.into();

        if player == game.creator {
            if game.move_commit_creator.revealed_data.is_some() {
                return Err(ContractError::MoveAlreadyCommitted);
            }
            if computed_bytes != game.move_commit_creator.commitment {
                return Err(ContractError::InvalidReveal);
            }
            game.move_commit_creator.revealed_data = Some(move_data);
            game.move_commit_creator.salt = Some(salt);
        } else if Some(player.clone()) == game.opponent {
            if game.move_commit_opponent.revealed_data.is_some() {
                return Err(ContractError::MoveAlreadyCommitted);
            }
            if computed_bytes != game.move_commit_opponent.commitment {
                return Err(ContractError::InvalidReveal);
            }
            game.move_commit_opponent.revealed_data = Some(move_data);
            game.move_commit_opponent.salt = Some(salt);
        } else {
            return Err(ContractError::NotParticipant);
        }

        // If both revealed, resolve the game
        if game.move_commit_creator.revealed_data.is_some()
            && game.move_commit_opponent.revealed_data.is_some()
        {
            let creator_move = game.move_commit_creator.revealed_data.unwrap();
            let opponent_move = game.move_commit_opponent.revealed_data.unwrap();
            let winner = Self::determine_rps_winner(creator_move, opponent_move);

            let pot = game.entry_fee * 2;

            if winner == 0 {
                // Draw - return entry fees
                let creator_bal: u128 = env
                    .storage()
                    .instance()
                    .get(&DataKey::Balance(game.creator.clone()))
                    .unwrap_or(0);
                env.storage()
                    .instance()
                    .set(
                        &DataKey::Balance(game.creator.clone()),
                        &(creator_bal + game.entry_fee),
                    );

                let opponent_bal: u128 = env
                    .storage()
                    .instance()
                    .get(&DataKey::Balance(
                        game.opponent.clone().unwrap(),
                    ))
                    .unwrap_or(0);
                env.storage()
                    .instance()
                    .set(
                        &DataKey::Balance(game.opponent.clone().unwrap()),
                        &(opponent_bal + game.entry_fee),
                    );

                game.winner = None;
            } else if winner == 1 {
                let creator_bal: u128 = env
                    .storage()
                    .instance()
                    .get(&DataKey::Balance(game.creator.clone()))
                    .unwrap_or(0);
                env.storage()
                    .instance()
                    .set(
                        &DataKey::Balance(game.creator.clone()),
                        &(creator_bal + pot),
                    );
                game.winner = Some(game.creator.clone());
            } else {
                let opponent_addr = game.opponent.clone().unwrap();
                let opponent_bal: u128 = env
                    .storage()
                    .instance()
                    .get(&DataKey::Balance(opponent_addr.clone()))
                    .unwrap_or(0);
                env.storage()
                    .instance()
                    .set(
                        &DataKey::Balance(opponent_addr.clone()),
                        &(opponent_bal + pot),
                    );
                game.winner = Some(opponent_addr);
            }

            game.state = GameState::Completed;
        }

        env.storage()
            .instance()
            .set(&DataKey::Game(game_id), &game);

        env.events().publish(
            (symbol_short!("game"), symbol_short!("reveal")),
            (game_id, player, move_data),
        );

        Ok(())
    }

    pub fn get_rps_game(env: Env, game_id: u64) -> Result<Game, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Game(game_id))
            .ok_or(ContractError::GameNotFound)
    }

    pub fn get_all_rps_games(env: Env) -> Vec<Game> {
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::GameCounter)
            .unwrap_or(0);
        let mut games: Vec<Game> = Vec::new(&env);
        for i in 1..=counter {
            if let Some(game) = env.storage().instance().get(&DataKey::Game(i)) {
                games.push_back(game);
            }
        }
        games
    }

    // ────────────── Prediction Market Methods ──────────────

    pub fn create_prediction(
        env: Env,
        creator: Address,
        question: Symbol,
        options: Vec<Symbol>,
        resolution_time: u64,
    ) -> Result<u64, ContractError> {
        creator.require_auth();

        if options.len() < 2 {
            panic!("need at least 2 options");
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PredictionCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::PredictionCounter, &counter);

        let mut total_bets: Vec<u128> = Vec::new(&env);
        for _ in 0..options.len() {
            total_bets.push_back(0u128);
        }

        let prediction = Prediction {
            id: counter,
            creator: creator.clone(),
            question,
            options,
            resolution_time,
            resolved: false,
            winning_option: 0,
            total_bets,
            bets: Vec::new(&env),
        };

        env.storage()
            .instance()
            .set(&DataKey::Prediction(counter), &prediction);

        env.events().publish(
            (symbol_short!("pred"), symbol_short!("create")),
            (counter, creator),
        );

        Ok(counter)
    }

    pub fn place_bet(
        env: Env,
        prediction_id: u64,
        predictor: Address,
        option_index: u32,
        amount: u128,
    ) -> Result<(), ContractError> {
        predictor.require_auth();

        let mut prediction: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .ok_or(ContractError::PredictionNotFound)?;

        if prediction.resolved {
            return Err(ContractError::PredictionAlreadyResolved);
        }

        if option_index >= prediction.options.len() {
            return Err(ContractError::InvalidOption);
        }

        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(predictor.clone()))
            .unwrap_or(0);
        if bal < amount {
            return Err(ContractError::InsufficientBalance);
        }

        let bet = Bet {
            predictor: predictor.clone(),
            option_index,
            amount,
            claimed: false,
        };
        prediction.bets.push_back(bet);

        let mut new_totals: Vec<u128> = Vec::new(&env);
        for i in 0..prediction.options.len() {
            let prev = if i < prediction.total_bets.len() {
                prediction.total_bets.get(i as u32).unwrap_or(0)
            } else {
                0
            };
            if i == option_index {
                new_totals.push_back(prev + amount);
            } else {
                new_totals.push_back(prev);
            }
        }
        prediction.total_bets = new_totals;

        env.storage()
            .instance()
            .set(&DataKey::Prediction(prediction_id), &prediction);

        env.storage()
            .instance()
            .set(
                &DataKey::Balance(predictor.clone()),
                &(bal - amount),
            );

        env.events().publish(
            (symbol_short!("pred"), symbol_short!("bet")),
            (prediction_id, predictor, option_index, amount),
        );

        Ok(())
    }

    pub fn resolve_prediction(
        env: Env,
        prediction_id: u64,
        resolver: Address,
        winning_option: u32,
    ) -> Result<(), ContractError> {
        resolver.require_auth();

        let mut prediction: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .ok_or(ContractError::PredictionNotFound)?;

        if prediction.resolved {
            return Err(ContractError::PredictionAlreadyResolved);
        }

        if resolver != prediction.creator {
            return Err(ContractError::Unauthorized);
        }

        if winning_option >= prediction.options.len() {
            return Err(ContractError::InvalidOption);
        }

        prediction.resolved = true;
        prediction.winning_option = winning_option;

        env.storage()
            .instance()
            .set(&DataKey::Prediction(prediction_id), &prediction);

        env.events().publish(
            (symbol_short!("pred"), symbol_short!("resolve")),
            (prediction_id, winning_option),
        );

        Ok(())
    }

    pub fn claim_winnings(
        env: Env,
        prediction_id: u64,
        claimant: Address,
    ) -> Result<u128, ContractError> {
        claimant.require_auth();

        let prediction: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .ok_or(ContractError::PredictionNotFound)?;

        if !prediction.resolved {
            return Err(ContractError::PredictionNotResolved);
        }

        let mut total_won = 0u128;

        // Calculate total pool
        let mut pool = 0u128;
        for bet in prediction.bets.iter() {
            pool += bet.amount;
        }

        // Calculate total winning bets
        let mut winning_pool = 0u128;
        for bet in prediction.bets.iter() {
            if bet.option_index == prediction.winning_option {
                winning_pool += bet.amount;
            }
        }

        let mut remaining_bets: Vec<Bet> = Vec::new(&env);
        for bet in prediction.bets.iter() {
            if bet.predictor == claimant
                && bet.option_index == prediction.winning_option
                && !bet.claimed
            {
                let share = if winning_pool > 0 {
                    (bet.amount * pool) / winning_pool
                } else {
                    bet.amount
                };
                total_won += share;

                let mut claimed_bet = bet;
                claimed_bet.claimed = true;
                remaining_bets.push_back(claimed_bet);
            } else {
                remaining_bets.push_back(bet);
            }
        }

        if total_won == 0 {
            return Err(ContractError::NoWinningsToClaim);
        }

        // Update storage with claimed bets
        // We need to write back the modified prediction
        // Actually let's simplify - just add winnings to balance
        let bal: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance(claimant.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(
                &DataKey::Balance(claimant.clone()),
                &(bal + total_won),
            );

        // Update prediction to mark bets as claimed
        // Read it back and update
        let mut updated_pred: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .unwrap();
        let mut new_bets: Vec<Bet> = Vec::new(&env);
        for bet in updated_pred.bets.iter() {
            if bet.predictor == claimant && bet.option_index == prediction.winning_option && !bet.claimed {
                let mut cb = bet;
                cb.claimed = true;
                new_bets.push_back(cb);
            } else {
                new_bets.push_back(bet);
            }
        }
        updated_pred.bets = new_bets;
        env.storage()
            .instance()
            .set(&DataKey::Prediction(prediction_id), &updated_pred);

        env.events().publish(
            (symbol_short!("pred"), symbol_short!("claim")),
            (prediction_id, claimant, total_won),
        );

        Ok(total_won)
    }

    pub fn get_prediction(env: Env, prediction_id: u64) -> Result<Prediction, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .ok_or(ContractError::PredictionNotFound)
    }

    pub fn get_all_predictions(env: Env) -> Vec<Prediction> {
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PredictionCounter)
            .unwrap_or(0);
        let mut predictions: Vec<Prediction> = Vec::new(&env);
        for i in 1..=counter {
            if let Some(p) = env.storage().instance().get(&DataKey::Prediction(i)) {
                predictions.push_back(p);
            }
        }
        predictions
    }

    // ────────────── Internal Helpers ──────────────

    fn determine_rps_winner(creator_move: u32, opponent_move: u32) -> u8 {
        // 0 = rock, 1 = paper, 2 = scissors
        // Returns: 0 = draw, 1 = creator wins, 2 = opponent wins
        if creator_move == opponent_move {
            return 0; // draw
        }
        match (creator_move, opponent_move) {
            (0, 2) | (1, 0) | (2, 1) => 1, // creator wins
            _ => 2, // opponent wins
        }
    }

    fn get_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }
}
