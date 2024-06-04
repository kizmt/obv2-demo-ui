# OB V2 Example UI

## Getting Started

To get started with the obv2 demo UI, follow these steps:

### Step 1: Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/your-repo/obv2-demo-ui.git
cd obv2-demo-ui
```

### Step 2: Install Dependencies

Install the required dependencies using your preferred package manager:

```bash
npm install
# or
bun install
```

### Step 3: Configure RPC Endpoint

Before running the development server, you need to configure your RPC endpoint and potentially WS key.

1. Open the `globalState.js` file in the redux folder of the project.
2. Add your RPC endpoint and Helius WS key:

    ```
    HELIUS_KEY = "YOUR_HELIUS_KEY_HERE";
    RPC_ENDPOINT = "YOUR_RPC_ENDPOINT_HERE"; 
    ```

If you do not use Helius, modify the `HELIUS_WS_URL` variable in `utils/useMarket.ts`

### Step 4: Run the Development Server

Start the development server:

```bash
npm run dev
# or
bun dev
```

### Features

The UI currently offers the following features:

1. Create Openbook V2 markets.
2. Set your RPC configuration within the UI.
3. Swap & browse a vast range of tokens.
4. Set and fully customize UI themes (coming soon)
5. Trading (coming soon)

Submit a PR if you'd like to contribute!
