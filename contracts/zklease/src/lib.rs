#![no_std]
#![allow(deprecated)]

mod test;
mod types;
mod verifier;

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Bytes, Env, Symbol, Vec};

use crate::types::{ContractError, Credential, DataKey};
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

    fn get_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }
}
