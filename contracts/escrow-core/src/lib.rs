#![no_std]
#![allow(clippy::needless_borrows_for_generic_args)]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, symbol_short, Address, Bytes, Env, Map,
    String, Symbol, Vec,
};

// ── Storage keys ─────────────────────────────────────────────────────────────

const ADMIN: Symbol = symbol_short!("ADMIN");
const ESCROWS: Symbol = symbol_short!("ESCROWS");
const DEP_IDX: Symbol = symbol_short!("DEPIDX");

// ── Types ─────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum EscrowStatus {
    Pending,
    Funded,
    Released,
    Refunded,
    Disputed,
    Resolved,
}

/// Parameters for creating a new escrow (avoids too-many-arguments lint).
#[contracttype]
#[derive(Clone)]
pub struct CreateEscrowParams {
    pub escrow_id: String,
    pub depositor: Address,
    pub beneficiary: Address,
    pub arbiter: Address,
    pub amount: i128,
    pub token: Address,
    pub expiry_ts: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct EscrowData {
    pub escrow_id: String,
    pub depositor: Address,
    pub beneficiary: Address,
    pub arbiter: Address,
    pub amount: i128,
    pub token: Address,
    pub expiry_ts: u64,
    pub status: EscrowStatus,
    pub evidence_hash: Option<Bytes>,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[contractevent]
pub struct EscrowCreated {
    #[topic]
    pub escrow_id: String,
    pub depositor: Address,
    pub beneficiary: Address,
    pub amount: i128,
}

#[contractevent]
pub struct EscrowFunded {
    #[topic]
    pub escrow_id: String,
    pub amount: i128,
}

#[contractevent]
pub struct EscrowReleased {
    #[topic]
    pub escrow_id: String,
    pub beneficiary: Address,
    pub amount: i128,
}

#[contractevent]
pub struct EscrowRefunded {
    #[topic]
    pub escrow_id: String,
    pub depositor: Address,
    pub amount: i128,
}

#[contractevent]
pub struct EscrowDisputed {
    #[topic]
    pub escrow_id: String,
    pub raised_by: Address,
}

#[contractevent]
pub struct DisputeResolved {
    #[topic]
    pub escrow_id: String,
    pub released_to_beneficiary: bool,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    // ── Admin ─────────────────────────────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage()
            .instance()
            .set(&ESCROWS, &Map::<String, EscrowData>::new(&env));
        env.storage()
            .instance()
            .set(&DEP_IDX, &Map::<Address, Vec<String>>::new(&env));
    }

    // ── Escrow lifecycle ──────────────────────────────────────────────────────

    /// Create a new escrow. Funds are not transferred yet — call fund_escrow next.
    pub fn create_escrow(env: Env, params: CreateEscrowParams) {
        params.depositor.require_auth();

        let mut escrows: Map<String, EscrowData> = env.storage().instance().get(&ESCROWS).unwrap();
        if escrows.contains_key(params.escrow_id.clone()) {
            panic!("escrow already exists");
        }

        let data = EscrowData {
            escrow_id: params.escrow_id.clone(),
            depositor: params.depositor.clone(),
            beneficiary: params.beneficiary.clone(),
            arbiter: params.arbiter,
            amount: params.amount,
            token: params.token,
            expiry_ts: params.expiry_ts,
            status: EscrowStatus::Pending,
            evidence_hash: None,
        };
        escrows.set(params.escrow_id.clone(), data);
        env.storage().instance().set(&ESCROWS, &escrows);

        // Index by depositor
        let mut idx: Map<Address, Vec<String>> = env.storage().instance().get(&DEP_IDX).unwrap();
        let mut list = idx
            .get(params.depositor.clone())
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(params.escrow_id.clone());
        idx.set(params.depositor.clone(), list);
        env.storage().instance().set(&DEP_IDX, &idx);

        EscrowCreated {
            escrow_id: params.escrow_id,
            depositor: params.depositor,
            beneficiary: params.beneficiary,
            amount: params.amount,
        }
        .publish(&env);
    }

    /// Depositor transfers tokens into the contract to fund the escrow.
    pub fn fund_escrow(env: Env, escrow_id: String) {
        let mut data = Self::load(&env, &escrow_id);
        if data.status != EscrowStatus::Pending {
            panic!("escrow not in pending state");
        }
        data.depositor.require_auth();

        soroban_sdk::token::Client::new(&env, &data.token).transfer(
            &data.depositor,
            &env.current_contract_address(),
            &data.amount,
        );

        data.status = EscrowStatus::Funded;
        Self::save(&env, data.clone());

        EscrowFunded {
            escrow_id,
            amount: data.amount,
        }
        .publish(&env);
    }

    /// Arbiter or depositor releases funds to beneficiary.
    pub fn release(env: Env, escrow_id: String, caller: Address) {
        caller.require_auth();
        let mut data = Self::load(&env, &escrow_id);
        if data.status != EscrowStatus::Funded {
            panic!("escrow not funded");
        }
        if caller != data.arbiter && caller != data.depositor {
            panic!("unauthorized");
        }

        soroban_sdk::token::Client::new(&env, &data.token).transfer(
            &env.current_contract_address(),
            &data.beneficiary,
            &data.amount,
        );

        data.status = EscrowStatus::Released;
        Self::save(&env, data.clone());

        EscrowReleased {
            escrow_id,
            beneficiary: data.beneficiary,
            amount: data.amount,
        }
        .publish(&env);
    }

    /// Arbiter refunds depositor (or anyone can trigger after expiry).
    pub fn refund(env: Env, escrow_id: String) {
        let mut data = Self::load(&env, &escrow_id);
        if data.status != EscrowStatus::Funded && data.status != EscrowStatus::Disputed {
            panic!("escrow not refundable");
        }

        let expired = env.ledger().timestamp() >= data.expiry_ts;
        if !expired {
            data.arbiter.require_auth();
        }

        soroban_sdk::token::Client::new(&env, &data.token).transfer(
            &env.current_contract_address(),
            &data.depositor,
            &data.amount,
        );

        data.status = EscrowStatus::Refunded;
        Self::save(&env, data.clone());

        EscrowRefunded {
            escrow_id,
            depositor: data.depositor,
            amount: data.amount,
        }
        .publish(&env);
    }

    /// Raise a dispute with an evidence hash (SHA-256 of off-chain evidence).
    pub fn dispute(env: Env, escrow_id: String, evidence_hash: Bytes, raised_by: Address) {
        raised_by.require_auth();
        let mut data = Self::load(&env, &escrow_id);
        if data.status != EscrowStatus::Funded {
            panic!("can only dispute funded escrow");
        }
        if raised_by != data.depositor && raised_by != data.beneficiary {
            panic!("only depositor or beneficiary can dispute");
        }

        data.status = EscrowStatus::Disputed;
        data.evidence_hash = Some(evidence_hash);
        Self::save(&env, data.clone());

        EscrowDisputed {
            escrow_id,
            raised_by,
        }
        .publish(&env);
    }

    /// Arbiter resolves a dispute.
    pub fn resolve_dispute(env: Env, escrow_id: String, release_to_beneficiary: bool) {
        let mut data = Self::load(&env, &escrow_id);
        if data.status != EscrowStatus::Disputed {
            panic!("escrow not in disputed state");
        }
        data.arbiter.require_auth();

        let recipient = if release_to_beneficiary {
            data.beneficiary.clone()
        } else {
            data.depositor.clone()
        };

        soroban_sdk::token::Client::new(&env, &data.token).transfer(
            &env.current_contract_address(),
            &recipient,
            &data.amount,
        );

        data.status = EscrowStatus::Resolved;
        Self::save(&env, data.clone());

        DisputeResolved {
            escrow_id,
            released_to_beneficiary: release_to_beneficiary,
        }
        .publish(&env);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    pub fn get_escrow(env: Env, escrow_id: String) -> EscrowData {
        Self::load(&env, &escrow_id)
    }

    pub fn get_escrows_by_depositor(env: Env, depositor: Address) -> Vec<String> {
        let idx: Map<Address, Vec<String>> = env.storage().instance().get(&DEP_IDX).unwrap();
        idx.get(depositor).unwrap_or_else(|| Vec::new(&env))
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    fn load(env: &Env, escrow_id: &String) -> EscrowData {
        let escrows: Map<String, EscrowData> = env.storage().instance().get(&ESCROWS).unwrap();
        escrows.get(escrow_id.clone()).expect("escrow not found")
    }

    fn save(env: &Env, data: EscrowData) {
        let mut escrows: Map<String, EscrowData> = env.storage().instance().get(&ESCROWS).unwrap();
        escrows.set(data.escrow_id.clone(), data);
        env.storage().instance().set(&ESCROWS, &escrows);
    }
}

mod test;
