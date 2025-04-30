# StoriaApp

StoriaApp is an interactive book reader application that enhances reading by generating ambient background music based on the content of each page. 

## Features

- Browse and search for classic books from Project Gutenberg
- Read books with paginated interface
- AI-generated background music that matches the mood and setting of each page
- Music plays continuously with seamless transitions between pages
- Background generation of music for upcoming pages
- Supabase-based music caching for faster loading and reduced API usage
- Mobile-responsive design

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **APIs**:
  - OpenAI API for generating music prompts
  - ElevenLabs API for generating background music
  - Project Gutenberg API for accessing books

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys for OpenAI and ElevenLabs

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/StoriaApp.git
   cd StoriaApp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory following the example in `.env.example`
   - See [ENV_SETUP.md](ENV_SETUP.md) for detailed environment variable instructions
   - **Important**: Storia uses a single `.env` file in the root directory for all environment variables

4. Start the development server:
   ```
   npm start
   ```

5. In a separate terminal, start the backend server:
   ```
   npm run server
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Deploying to Vercel

See the [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) guide for detailed deployment instructions.

## Troubleshooting

For Google authentication issues, see [GOOGLE_AUTH_TROUBLESHOOTING.md](GOOGLE_AUTH_TROUBLESHOOTING.md).

## License

[MIT License](LICENSE) 

