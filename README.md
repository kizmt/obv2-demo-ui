# Openbook V2 Demo UI Documentation

## Introduction

Welcome to the Openbook V2 Demo UI, a user interface for interacting with the Openbook V2 Central Limit Order Book (CLOB). This guide will help you get started with the demo, create markets, update logos and text settings, and adjust RPC connections from the Topbar.

## Getting Started

To get started with the Openbook V2 Demo UI, follow these steps:

### Step 1: Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/your-repo/openbook-v2-demo-ui.git
cd openbook-v2-demo-ui
```

### Step 2: Install Dependencies

Install the required dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Step 3: Configure RPC Endpoint and Helius API Key

Before running the development server, you need to configure your RPC endpoint and Helius API key.

1. Open the `.env` file in the root directory of the project.
2. Add your RPC endpoint and Helius API key:

    ```env
    NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-endpoint
    NEXT_PUBLIC_HELIUS_API_KEY=your-helius-api-key
    ```

If you do not use Helius, modify the `HELIUS_WS_URL` variable in `utils/useMarket.ts`

### Step 4: Run the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

#### Creating Markets

To create a new market in the Openbook V2 Demo UI, follow these steps:

1. Navigate to the "Create Market" section in the UI.
2. Fill in the required details such as market name, base token, quote token, and other parameters.
3. Click the "Create Market" button to initiate the market creation process.

The UI will guide you through the necessary steps, and you will receive a confirmation once the market is successfully created.

#### Updating Logos and Text Settings

To update logos and text settings in the Openbook V2 Demo UI:

1. Navigate to the "Settings" section in the UI.
2. Select the "Logos & Text" tab.
3. Upload new logos and modify text settings as needed.
4. Save your changes to apply them to the UI.

#### Adjusting RPC Connections

You can adjust the RPC connections directly from the Topbar:

1. Locate the RPC settings in the Topbar.
2. Enter the new RPC endpoint you want to use.
3. Save your changes to update the RPC connection.

This allows you to dynamically switch between different RPC endpoints without restarting the server.
