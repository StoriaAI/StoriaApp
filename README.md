# StoriaApp

StoriaApp is an interactive book reader application that enhances reading by generating ambient background music based on the content of each page. 

## Features

- Browse and search for classic books from Project Gutenberg
- Read books with paginated interface
- AI-generated background music that matches the mood and setting of each page
- Music plays continuously with seamless transitions between pages
- Background generation of music for upcoming pages
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

3. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   PORT=3001
   NODE_ENV=development
   ELEVENLABS_API_ENDPOINT=https://api.elevenlabs.io/v1/sound-generation
   OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
   GUTENBERG_API_ENDPOINT=https://gutendex.com/
   ```

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

### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup) if you don't have one
2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

### Deployment Steps

1. Login to Vercel:
   ```
   vercel login
   ```

2. Set up your Environment Variables in Vercel:
   - Go to your Vercel dashboard
   - Select your project
   - Navigate to Settings > Environment Variables
   - Add the following environment variables:
     - `OPENAI_API_KEY`
     - `ELEVENLABS_API_KEY`
     - `ELEVENLABS_API_ENDPOINT`
     - `OPENAI_API_ENDPOINT`
     - `GUTENBERG_API_ENDPOINT`

3. Deploy your application:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

### Vercel Configuration

The application includes a `vercel.json` file that configures:
- Build settings
- API routes
- Environment variables

When deploying, Vercel will automatically:
1. Build the React frontend
2. Deploy the serverless API functions
3. Set up the proper routing for both frontend and API endpoints

## License

[MIT License](LICENSE) 

