#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, Env, Symbol, Vec};

fn create_valid_proof(env: &Env, num_pub_inputs: u32) -> Bytes {
    let mut p = Bytes::new(env);
    p.push_back(0x55);
    p.push_back(0x48);
    p.push_back(0x4B);
    p.push_back(0x01);
    for b in num_pub_inputs.to_le_bytes() {
        p.push_back(b);
    }
    for _ in 0..num_pub_inputs {
        for _ in 0..32 {
            p.push_back(0xAB);
        }
    }
    for _ in 0..64 {
        p.push_back(0xCD);
    }
    p
}

fn create_invalid_proof(env: &Env) -> Bytes {
    let mut p = Bytes::new(env);
    p.push_back(0xDE);
    p.push_back(0xAD);
    p.push_back(0xBE);
    p.push_back(0xEF);
    p
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    assert_eq!(client.get_threshold(), 0u128);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_initialize_twice_panics() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);
    client.initialize(&admin, &verifier);
}

#[test]
fn test_verify_proof_valid() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    let proof = create_valid_proof(&env, 0);
    let inputs: Vec<Bytes> = Vec::new(&env);

    assert!(client.verify_proof(&proof, &inputs));
}

#[test]
fn test_verify_proof_with_public_inputs() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    let proof = create_valid_proof(&env, 2);
    let mut inputs: Vec<Bytes> = Vec::new(&env);
    let mut pi1 = Bytes::new(&env);
    for _ in 0..32 {
        pi1.push_back(0x01);
    }
    inputs.push_back(pi1);

    let mut pi2 = Bytes::new(&env);
    for _ in 0..32 {
        pi2.push_back(0x02);
    }
    inputs.push_back(pi2);
    let inputs = inputs; // make immutable

    assert!(client.verify_proof(&proof, &inputs));
}

#[test]
fn test_verify_proof_wrong_magic() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    let proof = create_invalid_proof(&env);
    let inputs: Vec<Bytes> = Vec::new(&env);

    assert!(!client.verify_proof(&proof, &inputs));
}

#[test]
fn test_verify_proof_short_proof() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    let proof = Bytes::new(&env);
    let inputs: Vec<Bytes> = Vec::new(&env);

    assert!(!client.verify_proof(&proof, &inputs));
}

#[test]
fn test_verify_proof_pub_count_mismatch() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    let proof = create_valid_proof(&env, 0);
    let mut inputs: Vec<Bytes> = Vec::new(&env);
    let mut pi = Bytes::new(&env);
    for _ in 0..32 {
        pi.push_back(0x01);
    }
    inputs.push_back(pi);
    let inputs = inputs;

    assert!(!client.verify_proof(&proof, &inputs));
}

#[test]
fn test_grant_credential_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof = create_valid_proof(&env, 0);
    let cred_id = client.grant_credential(&user, &100u128, &proof);

    assert_eq!(cred_id, 1u64);

    let cred = client.get_credential(&cred_id);
    assert_eq!(cred.owner, user);
    assert_eq!(cred.threshold, 100);
    assert!(cred.is_active);
}

#[test]
#[should_panic]
fn test_grant_credential_below_threshold_panics() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);
    client.set_threshold(&200u128);

    let proof = create_valid_proof(&env, 0);
    client.grant_credential(&user, &100u128, &proof);
}

#[test]
#[should_panic]
fn test_grant_credential_invalid_proof_panics() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof = create_invalid_proof(&env);
    client.grant_credential(&user, &100u128, &proof);
}

#[test]
fn test_revoke_credential() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof = create_valid_proof(&env, 0);
    let cred_id = client.grant_credential(&user, &100u128, &proof);

    let cred_before = client.get_credential(&cred_id);
    assert!(cred_before.is_active);

    client.revoke_credential(&cred_id);

    let cred_after = client.get_credential(&cred_id);
    assert!(!cred_after.is_active);

    let owned = client.get_credentials_for(&user);
    assert!(!owned.iter().any(|id| id == cred_id));
}

#[test]
fn test_revoke_nonexistent_credential_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let result = client.try_revoke_credential(&999u64);
    assert!(result.is_err());
}

#[test]
fn test_get_threshold_default() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);

    assert_eq!(client.get_threshold(), 0u128);
}

#[test]
fn test_get_credential_not_found() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let result = client.try_get_credential(&999u64);
    assert!(result.is_err());
}

#[test]
fn test_get_credentials_for_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let owned = client.get_credentials_for(&user);
    assert_eq!(owned.len(), 0);
}

#[test]
fn test_multiple_credentials() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof1 = create_valid_proof(&env, 0);
    let id1 = client.grant_credential(&user, &100u128, &proof1);

    let proof2 = create_valid_proof(&env, 0);
    let id2 = client.grant_credential(&user, &200u128, &proof2);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);

    let owned = client.get_credentials_for(&user);
    assert_eq!(owned.len(), 2);
    assert!(owned.iter().any(|id| id == id1));
    assert!(owned.iter().any(|id| id == id2));
}

#[test]
fn test_set_threshold() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    assert_eq!(client.get_threshold(), 0);

    client.set_threshold(&500u128);
    assert_eq!(client.get_threshold(), 500);
}

#[test]
fn test_grant_and_revoke_multiple_users() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let p1 = create_valid_proof(&env, 0);
    let id_a = client.grant_credential(&alice, &50u128, &p1);

    let p2 = create_valid_proof(&env, 0);
    let _id_b = client.grant_credential(&bob, &75u128, &p2);

    assert_eq!(client.get_credentials_for(&alice).len(), 1);
    assert_eq!(client.get_credentials_for(&bob).len(), 1);

    client.revoke_credential(&id_a);
    assert_eq!(client.get_credentials_for(&alice).len(), 0);
    assert_eq!(client.get_credentials_for(&bob).len(), 1);

    let revoked = client.get_credential(&id_a);
    assert!(!revoked.is_active);
}

#[test]
fn test_credential_network_field() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof = create_valid_proof(&env, 0);
    let cred_id = client.grant_credential(&user, &100u128, &proof);

    let cred = client.get_credential(&cred_id);
    assert_eq!(cred.network, Symbol::new(&env, "zklease"));
}

#[test]
fn test_revoke_already_inactive_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let user = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let proof = create_valid_proof(&env, 0);
    let cred_id = client.grant_credential(&user, &100u128, &proof);

    client.revoke_credential(&cred_id);

    let result = client.try_revoke_credential(&cred_id);
    assert!(result.is_err());
}

// ────────────── RPS Game Tests ──────────────

fn commit_bytes(env: &Env, move_data: u32, salt: &[u8]) -> Bytes {
    let mut preimage = Bytes::new(env);
    for b in move_data.to_le_bytes() {
        preimage.push_back(b);
    }
    for b in salt {
        preimage.push_back(*b);
    }
    let hash: Bytes = env.crypto().sha256(&preimage).into();
    hash
}

#[test]
fn test_create_rps_game() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);

    assert_eq!(game_id, 1u64);

    let game = client.get_rps_game(&game_id);
    assert_eq!(game.creator, alice);
    assert_eq!(game.opponent, Some(bob.clone()));
    assert_eq!(game.state, crate::types::GameState::Waiting);
}

#[test]
fn test_create_rps_game_insufficient_balance() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let result = client.try_create_rps_game(&alice, &bob, &100u128);
    assert!(result.is_err());
}

#[test]
fn test_join_rps_game() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);
    client.join_rps_game(&game_id, &bob);

    let game = client.get_rps_game(&game_id);
    assert_eq!(game.state, crate::types::GameState::AwaitingReveal);
}

#[test]
fn test_join_rps_game_wrong_player() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let mallory = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);

    let result = client.try_join_rps_game(&game_id, &mallory);
    assert!(result.is_err());
}

#[test]
fn test_full_rps_game_flow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);
    client.join_rps_game(&game_id, &bob);

    // Alice commits rock (0)
    let alice_commit = commit_bytes(&env, 0, b"alice_salt_123");
    client.commit_move(&game_id, &alice, &alice_commit);

    // Bob commits paper (1)
    let bob_commit = commit_bytes(&env, 1, b"bob_salt_456");
    client.commit_move(&game_id, &bob, &bob_commit);

    // Alice reveals
    let alice_salt = Bytes::from_array(&env, b"alice_salt_123");
    client.reveal_move(&game_id, &alice, &0u32, &alice_salt);

    let game_after_alice = client.get_rps_game(&game_id);
    assert_eq!(game_after_alice.state, crate::types::GameState::AwaitingReveal);

    // Bob reveals
    let bob_salt = Bytes::from_array(&env, b"bob_salt_456");
    client.reveal_move(&game_id, &bob, &1u32, &bob_salt);

    // Paper beats rock, so Bob should win
    let game_final = client.get_rps_game(&game_id);
    assert_eq!(game_final.state, crate::types::GameState::Completed);
    assert_eq!(game_final.winner, Some(bob.clone()));
}

#[test]
fn test_rps_rock_beats_scissors() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);
    client.join_rps_game(&game_id, &bob);

    // Alice: rock (0), Bob: scissors (2)
    let ac = commit_bytes(&env, 0, b"a1");
    let bc = commit_bytes(&env, 2, b"b1");
    client.commit_move(&game_id, &alice, &ac);
    client.commit_move(&game_id, &bob, &bc);

    let asalt = Bytes::from_array(&env, b"a1");
    let bsalt = Bytes::from_array(&env, b"b1");
    client.reveal_move(&game_id, &alice, &0u32, &asalt);
    client.reveal_move(&game_id, &bob, &2u32, &bsalt);

    let game = client.get_rps_game(&game_id);
    assert_eq!(game.winner, Some(alice.clone()));
}

#[test]
fn test_rps_draw() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);
    client.join_rps_game(&game_id, &bob);

    // Both play rock (0)
    let ac = commit_bytes(&env, 0, b"a_draw");
    let bc = commit_bytes(&env, 0, b"b_draw");
    client.commit_move(&game_id, &alice, &ac);
    client.commit_move(&game_id, &bob, &bc);

    let asalt = Bytes::from_array(&env, b"a_draw");
    let bsalt = Bytes::from_array(&env, b"b_draw");
    client.reveal_move(&game_id, &alice, &0u32, &asalt);
    client.reveal_move(&game_id, &bob, &0u32, &bsalt);

    let game = client.get_rps_game(&game_id);
    assert_eq!(game.winner, None);
    assert_eq!(game.state, crate::types::GameState::Completed);
}

#[test]
fn test_rps_invalid_reveal_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let game_id = client.create_rps_game(&alice, &bob, &0u128);
    client.join_rps_game(&game_id, &bob);

    // Alice commits rock (0)
    let ac = commit_bytes(&env, 0, b"my_salt");
    client.commit_move(&game_id, &alice, &ac);

    // Alice tries to reveal paper (1) instead of rock (0)
    let wrong_salt = Bytes::from_array(&env, b"my_salt");
    let result = client.try_reveal_move(&game_id, &alice, &1u32, &wrong_salt);
    assert!(result.is_err());
}

#[test]
fn test_get_all_rps_games() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let games_before = client.get_all_rps_games();
    assert_eq!(games_before.len(), 0);

    client.create_rps_game(&alice, &bob, &0u128);
    client.create_rps_game(&bob, &alice, &0u128);

    let games_after = client.get_all_rps_games();
    assert_eq!(games_after.len(), 2);
}

// ────────────── Prediction Market Tests ──────────────

#[test]
fn test_create_prediction() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "yes"));
    options.push_back(Symbol::new(&env, "no"));

    let pred_id = client.create_prediction(
        &creator,
        &Symbol::new(&env, "XLM_price_1USD"),
        &options,
        &1000000u64,
    );

    assert_eq!(pred_id, 1u64);

    let pred = client.get_prediction(&pred_id);
    assert_eq!(pred.question, Symbol::new(&env, "XLM_price_1USD"));
    assert!(!pred.resolved);
}

#[test]
#[should_panic(expected = "need at least 2 options")]
fn test_create_prediction_too_few_options() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "only_option"));

    client.create_prediction(
        &creator,
        &Symbol::new(&env, "bad"),
        &options,
        &1000u64,
    );
}

#[test]
fn test_place_bet() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);
    let bettor = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "yes"));
    options.push_back(Symbol::new(&env, "no"));

    let pred_id = client.create_prediction(
        &creator, &Symbol::new(&env, "test"), &options, &1000000u64,
    );

    client.deposit(&bettor, &200u128);
    client.place_bet(&pred_id, &bettor, &0u32, &100u128);

    let pred = client.get_prediction(&pred_id);
    assert_eq!(pred.bets.len(), 1);
}

#[test]
fn test_resolve_prediction() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "yes"));
    options.push_back(Symbol::new(&env, "no"));

    let pred_id = client.create_prediction(
        &creator, &Symbol::new(&env, "test"), &options, &1000000u64,
    );

    client.resolve_prediction(&pred_id, &creator, &0u32);

    let pred = client.get_prediction(&pred_id);
    assert!(pred.resolved);
    assert_eq!(pred.winning_option, 0);
}

#[test]
fn test_resolve_prediction_non_creator_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);
    let other = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "yes"));
    options.push_back(Symbol::new(&env, "no"));

    let pred_id = client.create_prediction(
        &creator, &Symbol::new(&env, "test"), &options, &1000000u64,
    );

    let result = client.try_resolve_prediction(&pred_id, &other, &0u32);
    assert!(result.is_err());
}

#[test]
fn test_claim_winnings() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);
    let bettor = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "yes"));
    options.push_back(Symbol::new(&env, "no"));

    let pred_id = client.create_prediction(
        &creator, &Symbol::new(&env, "test"), &options, &1000000u64,
    );

    client.deposit(&bettor, &200u128);
    client.place_bet(&pred_id, &bettor, &0u32, &100u128);

    client.resolve_prediction(&pred_id, &creator, &0u32);

    let won = client.claim_winnings(&pred_id, &bettor);
    assert!(won > 0);
}

#[test]
fn test_deposit_and_withdraw() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    client.deposit(&admin, &1000u128);
    assert_eq!(client.get_balance(&admin), 1000);

    client.withdraw(&admin, &500u128);
    assert_eq!(client.get_balance(&admin), 500);
}

#[test]
fn test_get_all_predictions() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let creator = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let mut options: soroban_sdk::Vec<Symbol> = soroban_sdk::Vec::new(&env);
    options.push_back(Symbol::new(&env, "a"));
    options.push_back(Symbol::new(&env, "b"));

    assert_eq!(client.get_all_predictions().len(), 0);

    client.create_prediction(&creator, &Symbol::new(&env, "q1"), &options, &1000u64);
    client.create_prediction(&creator, &Symbol::new(&env, "q2"), &options, &2000u64);

    assert_eq!(client.get_all_predictions().len(), 2);
}

#[test]
fn test_deposit_insufficient_withdraw_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ZKLease);
    let client = ZKLeaseClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &verifier);

    let result = client.try_withdraw(&admin, &100u128);
    assert!(result.is_err());
}
