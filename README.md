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
Deployed contracts: [deploy-avax_test.json][2]

```sh
yarn hardhat run --network avax_test scripts/deploy.ts
```

[1]: https://github.com/pancakeswap/pancake-farm
[2]: https://github.com/buffet-dex/buffetswap-farm/blob/master/scripts/deploy-avax_test.json
