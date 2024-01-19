import React from 'react';
import {useEffect , useState } from "react";
import { Connection, clusterApiUrl, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import './App.css';

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

 /**
 * @description gets Phantom provider, if it exists
 */
 const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  const [signaturre, setSignature] = useState('');
  const [walletKey, setWalletKey] = useState('');
  const [account, setAccount] = useState('');
  const [account2, setAccount2] = useState<any>();
  useEffect(() => {
	  const provider = getProvider();

		// if the phantom provider exists, set this as the provider
	  if (provider) setProvider(provider);
	  else setProvider(undefined);
  }, []);

  // Function to create a new Solana account and airdrop 2 SOL to it
  const createAccount = async () => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();

      // Airdrop 2 SOL to the new account
      const airdropSignature = await connection.requestAirdrop(new PublicKey(publicKey), 2 * 1000500000);
      await connection.confirmTransaction(airdropSignature);
      console.log("Public Key of the generated keypair", publicKey);
      setAccount(publicKey);
      setAccount2(keypair);
    } catch (error) {
      console.error(error);
    }
  };

  // Function to connect to Phantom wallet
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

		// checks if phantom wallet exists
    if (solana) {
      try {
				// connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
				// update walletKey to be the public key
        setWalletKey(response.publicKey.toString());
      } catch (err) {
      // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  // Function to transfer 1 SOL to the connected wallet
  const transferSOL = async () => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const fromPublicKey = new PublicKey(account);
      const toPublicKey = new PublicKey(walletKey);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: 1 * 1000000000,
        })
      );
      const signature = await sendAndConfirmTransaction(connection, transaction, [account2]);
      setSignature(signature);
      console.log(`Transaction ${signature} sent`);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="App">
      <header className="App-header">
      <h2>Create a new Solana account</h2>
      {account==='' && (<button
        style={{
          fontSize: "16px",
          padding: "15px",
          fontWeight: "bold",
          borderRadius: "5px",
        }}
        onClick={createAccount}
      >
        Create Wallet
      </button>)}
      {account!=='' && <p>Created account</p> }
        <h2>Connect to Phantom Wallet</h2>
      {provider && !walletKey && (
      <button
        style={{
          fontSize: "16px",
          padding: "15px",
          fontWeight: "bold",
          borderRadius: "5px",
        }}
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
        )}
        {provider && walletKey && <p>Connected account</p> }

        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}

        <h2>Transfer to new wallet</h2>
      {signaturre==='' && (<button
        style={{
          fontSize: "16px",
          padding: "15px",
          fontWeight: "bold",
          borderRadius: "5px",
        }}
        onClick={transferSOL}
      >
        Transfer
      </button>)}
      {signaturre!=='' && <p>Transfer Complete</p> }
        </header>
    </div>
  );
}
//   return (
//     <div>
//       <button onClick={createAccount}>Create a new Solana account</button>
//       {account && <p>New account created: {account}</p>}
//       <button onClick={connectWallet}>Connect to Phantom Wallet</button>
//       {connected && <p>Connected to Phantom wallet</p>}
//       {connected && account && (
//         <button onClick={transferSOL}>Transfer 2 SOL to new wallet</button>
//       )}
//     </div>
//   );
// }
