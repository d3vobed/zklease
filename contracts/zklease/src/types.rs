use soroban_sdk::{contracterror, contracttype, Address, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Credential {
    pub owner: Address,
    pub threshold: u128,
    pub verification_timestamp: u64,
    pub network: Symbol,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Verifier,
    Threshold,
    CredentialCounter,
    Credential(u64),
    OwnerCredentials(Address),
}

#[derive(Debug, Clone, PartialEq)]
#[contracterror]
pub enum ContractError {
    Unauthorized = 1,
    AlreadyInitialized = 2,
    NotInitialized = 3,
    InvalidProof = 4,
    CredentialNotFound = 5,
    CredentialNotActive = 6,
    InvalidThreshold = 7,
    AlreadyHasCredential = 8,
}
