#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, Env, Vec};

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
