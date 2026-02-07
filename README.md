# CrossPay

Send money across borders in seconds. GBP goes in, USDC settles on-chain, and you pay 0.5% instead of 6%.

## Why this exists

Sending £100 to someone in another country costs about £6 in fees and takes 2-5 days to arrive. The World Bank puts the global average at 6.2%, but some routes hit 10% or more. For people sending money home to family, that's £45 billion lost to fees every year.

Banks use old wire transfer networks with multiple middlemen taking cuts. You can't track where your money is, recipients don't know the final amount until it lands, and weekends? Forget about it.

Companies like Wise and Remitly made this better by cutting out some banks, but they still charge 1-3% and take hours to days for settlement. Blockchain tech can push this further.

## How it works

You send pounds by typing someone's email. The platform swaps GBP to USDC (a digital dollar that trades 1:1 with USD) at the live exchange rate, takes a flat 0.5% fee, and sends USDC from a wallet straight to the recipient's blockchain address. The whole thing settles in about 5 seconds on Polygon.

Every payment gets a transaction hash you can verify on the blockchain. No mystery fees, no hidden conversion markups, no "processing time."

Yes, other crypto payment apps exist. This one's built as an open project you can fork, modify, or deploy yourself.

## What's inside

Built with Node.js, Express, MongoDB, React, and TypeScript. Authentication uses [@dax-side/jwt-abstraction](https://www.npmjs.com/package/@dax-side/jwt-abstraction) instead of manual JWT handling (refresh tokens, expiry checks, all that stuff is abstracted away). Blockchain interaction runs through ethers.js talking to Polygon's network.

Passwords get hashed with bcrypt. Private keys for the treasury wallet get encrypted with AES-256. Payments convert GBP to USDC using live rates and settle on Polygon Amoy testnet. The whole setup logs everything to files in case something breaks.

Testnet means fake USDC for testing. Mainnet deployment would need real funds, proper key management (hardware wallets or AWS KMS), and probably some regulatory paperwork depending on where you operate.

Register two accounts, deposit fake money to one, send it to the other by email, watch it settle on-chain.

## What you get

- Email registration and login with session persistence
- Mock GBP wallet (deposit/withdraw buttons for testing)
- Live GBP to USDC conversion
- Real USDC transfers on Polygon blockchain
- Transaction history with blockchain hashes
- Treasury wallet balance monitoring

API docs are at `http://localhost:5000/api-docs` when the backend's running.

## The tech decisions

**Polygon instead of Ethereum**: Gas costs $0.001 vs $5-50. Transactions confirm in 5 seconds vs 15+ seconds. Ethereum mainnet would make this unusable for small payments.

**USDC instead of Bitcoin or ETH**: Stablecoins don't fluctuate. Sending someone $100 and having it worth $87 by the time they check is bad UX. USDC stays pegged 1:1 to USD (backed by Circle's cash reserves).

**Testnet for now**: Mainnet requires real money, compliance processes, and proper security. This version works on Polygon Amoy testnet so you can experiment without risking anything.

**@dax-side/jwt-abstraction**: Handles token refresh, expiry, blacklisting, all the annoying JWT stuff. Saves writing 200 lines of boilerplate.

**MongoDB**: Relational databases work fine, but Mongoose schemas are faster to set up for this kind of project. Postgres would be better for production at scale.

## Limitations

This is a demo. The fiat side is mocked (buttons that add fake GBP balance). A production version would need Stripe, Plaid, or bank APIs for real deposits/withdrawals. KYC would become mandatory past certain amounts depending on jurisdiction. Rate limiting isn't implemented. No email notifications. Security's decent but not audited.

The code's MIT licensed. Fork it, change it, deploy it, sell it. Do whatever you want.

## If something breaks

Check logs in `backend/logs/`. Balance issues usually mean the treasury wallet ran out of USDC. Blockchain errors are often RPC rate limits or wrong private keys. Frontend errors show in browser console.
