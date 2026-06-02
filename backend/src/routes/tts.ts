import { Router, Request, Response } from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

const router = Router();

function createTTSClient() {
  const credJson = process.env.GOOGLE_CREDENTIALS_JSON;
  if (credJson) {
    let jsonStr = credJson;
    try {
      JSON.parse(credJson);
    } catch {
      jsonStr = Buffer.from(credJson, 'base64').toString('utf-8');
    }
    const credentials = JSON.parse(jsonStr);
    return new textToSpeech.TextToSpeechClient({ credentials });
  }
  return new textToSpeech.TextToSpeechClient();
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'textが必要です' });
    }

    const cleanText = text
      .replace(/Q\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'テキストが空です' });
    }

    const ttsClient = createTTSClient();
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: cleanText },
      voice: {
        languageCode: 'ja-JP',
        name: 'ja-JP-Neural2-B',
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
        pitch: 1.0,
        volumeGainDb: 1.0,
      },
    });

    const audioBuffer = response.audioContent as Buffer;
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

  } catch (err) {
    console.error('Google TTS エラー:', err);
    res.status(500).json({ error: 'TTS変換に失敗しました' });
  }
});

export default router;
