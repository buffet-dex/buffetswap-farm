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

### AVAX Testnet
- Deployed DishToken: [0xa53C113d8bE8930aa8430806F837277dAa43b4e4][5]
- Deployed PortionToken: [0x6865752fca5DC5Ee1C3d863Dd0D1fc3Aab2D4295][6]
- Deployed BuffetChef: [0xC5482641cdec925E6777B5B8Cf58b50A786a2689][7]
- Deployed MulticallV2: [0x08e213e0cdB3326D54f75787E954E61129B58208][9]
- Deployed DishVault: [0xE8C9Ad529b18d1a66676146F71b070ce5d3178A1][10]
- Deployed Mock USDC: [0xec7f8B49A28621c440C90Fa27bBE7F9661c6a295][8]

```sh
yarn hardhat run --network avax_test scripts/deploy_tokens.ts
yarn hardhat run --network avax_test scripts/deploy_chef.ts
yarn hardhat run --network avax_test scripts/deploy_multicall.ts
yarn hardhat run --network avax_test scripts/deploy_vault.ts
```

[1]: https://github.com/pancakeswap/pancake-farm
[5]: https://testnet.snowtrace.io/address/0xa53C113d8bE8930aa8430806F837277dAa43b4e4#code
[6]: https://testnet.snowtrace.io/address/0x6865752fca5DC5Ee1C3d863Dd0D1fc3Aab2D4295#code
[7]: https://testnet.snowtrace.io/address/0xC5482641cdec925E6777B5B8Cf58b50A786a2689#code
[8]: https://testnet.snowtrace.io/address/0xec7f8B49A28621c440C90Fa27bBE7F9661c6a295#code
[9]: https://testnet.snowtrace.io/address/0x08e213e0cdB3326D54f75787E954E61129B58208#code
[10]: https://testnet.snowtrace.io/address/0xE8C9Ad529b18d1a66676146F71b070ce5d3178A1#code
