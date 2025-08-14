const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Load service account credentials
const SERVICE_ACCOUNT_PATH = './apikey.json';
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('Service account file not found!');
  process.exit(1);
}

const SERVICE_ACCOUNT = require(SERVICE_ACCOUNT_PATH);

// Configure Google Drive authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: SERVICE_ACCOUNT.client_email,
    private_key: SERVICE_ACCOUNT.private_key.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

// Presentation configuration with folder IDs
const PRESENTATION_CONFIG = {
  'rise-up': {
    name: 'Rise Up',
    imagesFolderId: '1HPvJH-79p8XOj3zc2F9FcutP_iEcNDFK',
    videosFolderId: '1tKVjoxm9l6TtOw1v3zTFdsGqiGmozadY'
  },
  'filhos-do-sim': {
    name: 'Filhos do Sim',
    imagesFolderId: '1wgwt_cci68O6eGnDe1NHa8vM_C_BQjMq', // Replace with actual ID
    videosFolderId: '1-gxWoDrsWRFrzVF4N9hUq6L9jZS6zXec' // Replace with actual ID
  },
  'jmj': {
    name: 'JMJ',
    imagesFolderId: '1mMcHuqy4uwLZ73QOIWyYAxYuh2qovYvs', // Replace with actual ID
    videosFolderId: '1CpLZWLT8T3hC_QilD5uuhDpyr6RwWW_I' // Replace with actual ID
  },
  'uma-gota-no-oceano': {
    name: 'Uma Gota no Oceano',
    imagesFolderId: '1Ig3_pnTluHe3n5E7it48mMaSq6nTjQfb', // Replace with actual ID
    videosFolderId: '1ENaHP-B7YbJaaxgvF3OuMqsflWr-g8-8' // Replace with actual ID
  },
  'jesus-cristo-superstar': {
    name: 'Jesus Cristo Superstar',
    imagesFolderId: '1PnZIxVqfkRcbzs4PmtMoKopm1aXOWWFu', // Replace with actual ID
    videosFolderId: '1OoEbC0SLTa2Aiv6aOP8MAPaAE_iW-K_f' // Replace with actual ID
  },
  'nas-asas-do-sonho': {
    name: 'Nas Asas do Sonho',
    imagesFolderId: '1835kSqPWviJzzjYZ9Fiytk9E5yIyPYYp', // Replace with actual ID
    videosFolderId: '16vxxX2zEbkZ7EQPxm4hZw4_0BUqsvMSu' // Replace with actual ID
  },
  'o-principe-e-a-lavadeira': {
    name: 'O Príncipe e a Lavadeira',
    imagesFolderId: '1dhqOJRIuW4_kB7jnZBd95Q8YTS9VkBOb', // Replace with actual ID
    videosFolderId: '19zhOkcqDlEVCBWze2L3Epa1okdRxGD5R' // Replace with actual ID
  },
  'abertura-jogos-salesianos': {
    name: 'Abertura Jogos Salesianos',
    imagesFolderId: '1awmmjkJZgbsviEXIxWezp_60Nz2c0Pxb', // Replace with actual ID
    videosFolderId: '1BWaoTPNBf7ARM3NVp5TWuPseArS3wIks' // Replace with actual ID
  }
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/gallery', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    let allItems = [];

    // Process each presentation
    for (const [presentationKey, config] of Object.entries(PRESENTATION_CONFIG)) {
      try {
        console.log(`Processing: ${config.name}`);
        
        // Fetch images for this presentation
        const imagesResponse = await drive.files.list({
          q: `'${config.imagesFolderId}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, webContentLink, createdTime)',
          orderBy: 'createdTime desc'
        });
        
        // Fetch videos for this presentation
        const videosResponse = await drive.files.list({
          q: `'${config.videosFolderId}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, webContentLink, videoMediaMetadata, createdTime)',
          orderBy: 'createdTime desc'
        });

        // Process images
        const images = imagesResponse.data.files.map(file => ({
          id: file.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=w500`,
          hqSrc: `/api/image/${file.id}`,
          type: 'image',
          presentation: presentationKey,
          presentationName: config.name,
          createdTime: file.createdTime
        }));

        // Process videos
        const videos = videosResponse.data.files.map(file => {
          let duration = '';
          if (file.videoMediaMetadata?.durationMillis) {
            duration = formatDuration(file.videoMediaMetadata.durationMillis);
          }
          
          return {
            id: file.id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=w500`,
            src: `https://drive.google.com/file/d/${file.id}/preview`,
            type: 'video',
            presentation: presentationKey,
            presentationName: config.name,
            duration: duration,
            createdTime: file.createdTime
          };
        });

        console.log(` - Images: ${images.length}, Videos: ${videos.length}`);
        allItems = [...allItems, ...images, ...videos];
      } catch (error) {
        console.error(`Error processing ${config.name}:`, error);
        console.error(`- Images Folder: ${config.imagesFolderId}`);
        console.error(`- Videos Folder: ${config.videosFolderId}`);
      }
    }

    // Sort by creation time
    allItems.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(allItems);
  } catch (error) {
    console.error('Drive API error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery data' });
  }
});

// Image streaming endpoint
app.get('/api/image/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = req.params.id;

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    // Set proper caching headers (1 day)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Error fetching image');
  }
});

// Video streaming endpoint
app.get('/api/video/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = req.params.id;

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).send('Error fetching video');
  }
});

// Helper function to format duration
function formatDuration(millis) {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Serve galeria.html at the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'galeria.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
