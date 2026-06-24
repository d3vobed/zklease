use std::cmp;

fn main(
    balance: Field,
    threshold: pub Field,
    user_address: pub Field,
) {
    cmp::assert_le(threshold, balance);
}
