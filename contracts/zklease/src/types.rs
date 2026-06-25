use soroban_sdk::{contracterror, contracttype, Address, Bytes, Symbol, Vec};

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
pub enum GameState {
    Waiting,
    AwaitingReveal,
    Revealed,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MoveCommit {
    pub commitment: Bytes,
    pub revealed_data: Option<u32>,
    pub salt: Option<Bytes>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub id: u64,
    pub creator: Address,
    pub opponent: Option<Address>,
    pub entry_fee: u128,
    pub move_commit_creator: MoveCommit,
    pub move_commit_opponent: MoveCommit,
    pub state: GameState,
    pub winner: Option<Address>,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bet {
    pub predictor: Address,
    pub option_index: u32,
    pub amount: u128,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Prediction {
    pub id: u64,
    pub creator: Address,
    pub question: Symbol,
    pub options: Vec<Symbol>,
    pub resolution_time: u64,
    pub resolved: bool,
    pub winning_option: u32,
    pub total_bets: Vec<u128>,
    pub bets: Vec<Bet>,
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
    GameCounter,
    Game(u64),
    PredictionCounter,
    Prediction(u64),
    Balance(Address),
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
    GameNotFound = 9,
    GameNotJoinable = 10,
    MoveAlreadyCommitted = 11,
    InvalidReveal = 12,
    GameNotAwaitingReveal = 13,
    PredictionNotFound = 14,
    PredictionAlreadyResolved = 15,
    InvalidOption = 16,
    InsufficientBalance = 17,
    NoWinningsToClaim = 18,
    NotParticipant = 19,
    GameAlreadyCompleted = 20,
    PredictionNotResolved = 21,
    GameNotExpired = 22,
}
