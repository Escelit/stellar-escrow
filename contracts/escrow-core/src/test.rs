#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Bytes, Env, String,
};

fn setup() -> (Env, EscrowContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

fn setup_token(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone())
        .address()
}

fn make_escrow(
    env: &Env,
    client: &EscrowContractClient,
    depositor: &Address,
    beneficiary: &Address,
    arbiter: &Address,
    token: &Address,
    amount: i128,
) -> String {
    env.ledger().set_timestamp(1_000_000);
    let params = CreateEscrowParams {
        escrow_id: String::from_str(env, "escrow-001"),
        depositor: depositor.clone(),
        beneficiary: beneficiary.clone(),
        arbiter: arbiter.clone(),
        amount,
        token: token.clone(),
        expiry_ts: 2_000_000,
    };
    client.create_escrow(&params);
    params.escrow_id
}

#[test]
fn test_initialize() {
    let (_, client, _) = setup();
    let _ = client;
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize() {
    let (_, client, admin) = setup();
    client.initialize(&admin);
}

#[test]
fn test_create_escrow() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    let data = client.get_escrow(&id);
    assert_eq!(data.status, EscrowStatus::Pending);
    assert_eq!(data.amount, 100);
}

#[test]
#[should_panic(expected = "escrow already exists")]
fn test_duplicate_escrow_id() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
}

#[test]
fn test_fund_and_release() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token::StellarAssetClient::new(&env, &token).mint(&depositor, &1000);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    client.fund_escrow(&id);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Funded);

    client.release(&id, &arbiter);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Released);
}

#[test]
fn test_fund_and_refund_by_arbiter() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token::StellarAssetClient::new(&env, &token).mint(&depositor, &1000);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    client.fund_escrow(&id);
    client.refund(&id);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Refunded);
}

#[test]
fn test_dispute_and_resolve_to_beneficiary() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token::StellarAssetClient::new(&env, &token).mint(&depositor, &1000);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    client.fund_escrow(&id);

    let evidence = Bytes::from_slice(&env, &[0u8; 32]);
    client.dispute(&id, &evidence, &depositor);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Disputed);

    client.resolve_dispute(&id, &true);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Resolved);
}

#[test]
fn test_dispute_and_resolve_to_depositor() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token::StellarAssetClient::new(&env, &token).mint(&depositor, &1000);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    client.fund_escrow(&id);

    let evidence = Bytes::from_slice(&env, &[0u8; 32]);
    client.dispute(&id, &evidence, &beneficiary);
    client.resolve_dispute(&id, &false);
    assert_eq!(client.get_escrow(&id).status, EscrowStatus::Resolved);
}

#[test]
fn test_get_escrows_by_depositor() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    env.ledger().set_timestamp(1_000_000);
    for id in ["e1", "e2"] {
        client.create_escrow(&CreateEscrowParams {
            escrow_id: String::from_str(&env, id),
            depositor: depositor.clone(),
            beneficiary: beneficiary.clone(),
            arbiter: arbiter.clone(),
            amount: 100,
            token: token.clone(),
            expiry_ts: 2_000_000,
        });
    }

    assert_eq!(client.get_escrows_by_depositor(&depositor).len(), 2);
}

#[test]
#[should_panic(expected = "escrow not funded")]
fn test_release_unfunded_panics() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    client.release(&id, &arbiter);
}

#[test]
#[should_panic(expected = "can only dispute funded escrow")]
fn test_dispute_unfunded_panics() {
    let (env, client, admin) = setup();
    let token = setup_token(&env, &admin);
    let depositor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let arbiter = Address::generate(&env);

    let id = make_escrow(
        &env,
        &client,
        &depositor,
        &beneficiary,
        &arbiter,
        &token,
        100,
    );
    let evidence = Bytes::from_slice(&env, &[0u8; 32]);
    client.dispute(&id, &evidence, &depositor);
}
