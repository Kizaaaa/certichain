# Tugas Besar II (Tubes II) IF4020 Kriptografi Sem. I Tahun 2025/2026

## Sistem Pencatatan Ijazah Digital Berbasis Blockchain atau Centralized Immutable Ledger

## Link smart contract etherscan

https://sepolia.etherscan.io/address/0xaf8415F54E128e96a0487c3EAa6FC2166D981510

## Daftar Fungsi

1. Penerbitan Ijazah : Issuer dapat menerbitkan ijazah
2. Pencabutan Ijazah : Issuer dapat mencabut ijazah yang telah diterbitkan
3. Melihat Ijazah : Siapapun dapat melihat ijazah beserta statusnya yang telah diterbitkan issuer jika memiliki link unlistednya

## Cara menjalankan

1. Clone

```sh
git clone https://github.com/Kizaaaa/certichain.git
```

2. Pindah ke frontend

```sh
cd frontend
```

3. Install dependencies

```sh
npm install
```

4. Buat .env.local :

```sh
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_NETWORK=
NEXT_PUBLIC_PINATA_API_KEY=
NEXT_PUBLIC_PINATA_SECRET_API_KEY=
ADMIN_PUBLIC_ADDRESS=
```

5. Run

```sh
npm run dev
```

## Pembagian tugas

- 13522010 : Issuer, Web
- 13522044 : Revoker, Web, Viewer
- 13522059 : Blockchain, Web

## Dependencies

### Root (Blockchain/Hardhat)

| Package | Version |
|---------|---------|
| @openzeppelin/contracts | ^5.4.0 |
| @react-pdf/renderer | ^4.3.1 |
| buffer | ^6.0.3 |
| dotenv | ^17.2.3 |
| html2canvas | ^1.4.1 |
| ipfs-http-client | ^60.0.1 |
| jspdf | ^3.0.4 |
| pinata | ^2.5.2 |

#### Dev Dependencies

| Package | Version |
|---------|---------|
| @nomicfoundation/hardhat-ethers | ^4.0.3 |
| @nomicfoundation/hardhat-ignition | ^3.0.6 |
| @nomicfoundation/hardhat-toolbox-mocha-ethers | ^3.0.2 |
| @types/chai | ^4.3.20 |
| @types/chai-as-promised | ^8.0.2 |
| @types/mocha | ^10.0.10 |
| @types/node | ^22.19.3 |
| chai | ^5.3.3 |
| ethers | ^6.16.0 |
| forge-std | github:foundry-rs/forge-std#v1.9.4 |
| hardhat | ^3.1.0 |
| mocha | ^11.7.5 |
| typescript | ~5.8.0 |

### Frontend (Next.js)

| Package | Version |
|---------|---------|
| axios | ^1.13.2 |
| ethers | ^6.16.0 |
| html2canvas | ^1.4.1 |
| jspdf | ^3.0.4 |
| next | 16.1.1 |
| pdf-lib | ^1.17.1 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-pdf | ^10.2.0 |

#### Dev Dependencies

| Package | Version |
|---------|---------|
| @tailwindcss/postcss | ^4 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| eslint | ^9 |
| eslint-config-next | 16.1.1 |
| tailwindcss | ^4 |
| typescript | ^5 |

