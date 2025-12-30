import RNFS from 'react-native-fs';

// Import API key from gitignored secrets file
// If secrets.local.ts doesn't exist, the app will still build but this feature won't work
let OPENAI_API_KEY = '';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const secrets = require('./secrets.local');
  OPENAI_API_KEY = secrets.OPENAI_API_KEY || '';
} catch {
  console.log('OpenAI API key not configured - card enhancement disabled');
}

interface CardEnhanceResult {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}

/**
 * Use OpenAI DALL-E to edit and enhance the actual scanned business card image
 * This keeps the original card but cleans it up
 */
export async function enhanceCardImage(imageUri: string): Promise<CardEnhanceResult> {
  try {
    // Read image and convert to base64
    const base64Image = await RNFS.readFile(imageUri, 'base64');

    // Use DALL-E image edit to clean up the actual card photo
    // Create form data with the image
    const formData = new FormData();

    // Convert base64 to blob for the API
    const response = await fetch(`data:image/png;base64,${base64Image}`);
    const blob = await response.blob();

    formData.append('image', blob, 'card.png');
    formData.append('prompt', 'Clean up this business card photo: straighten the card to be perfectly aligned and rectangular, remove any shadows or glare, make the background clean and dark, enhance the contrast and sharpness. Keep the exact same card content and design, just make it look like a professional scan.');
    formData.append('model', 'dall-e-2');
    formData.append('size', '1024x1024');

    const editResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!editResponse.ok) {
      const error = await editResponse.json();
      console.error('OpenAI edit error:', error);

      // Fallback: just return original since edit didn't work
      return { success: false, error: 'Image edit not available' };
    }

    const editData = await editResponse.json();
    const enhancedUrl = editData.data?.[0]?.url;

    if (enhancedUrl) {
      return { success: true, enhancedUrl };
    }

    return { success: false, error: 'No enhanced image returned' };
  } catch (error) {
    console.error('Card enhancement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed'
    };
  }
}
