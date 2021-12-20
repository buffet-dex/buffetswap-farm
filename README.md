# Buffet Farming

Forked from [Pancakeswap Farm][1].

# Local Development

The following assumes the use of `node@>=16`.

## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## Deploy

### BSC Testnet
- Deployed DishToken: [0xa53C113d8bE8930aa8430806F837277dAa43b4e4][2]
- Deployed PortionToken: [0x6865752fca5DC5Ee1C3d863Dd0D1fc3Aab2D4295][3]
- Deployed BuffetChef: [0xC5482641cdec925E6777B5B8Cf58b50A786a2689][4]

```sh
yarn hardhat run --network bsc_test scripts/deploy_tokens.ts
yarn hardhat run --network bsc_test scripts/deploy_chef.ts
```

[1]: https://github.com/pancakeswap/pancake-farm
[2]: https://testnet.bscscan.com/address/0xa53C113d8bE8930aa8430806F837277dAa43b4e4#code
[3]: https://testnet.bscscan.com/address/0x6865752fca5DC5Ee1C3d863Dd0D1fc3Aab2D4295#code
[4]: https://testnet.bscscan.com/address/0xC5482641cdec925E6777B5B8Cf58b50A786a2689#code
