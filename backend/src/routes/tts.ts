import { Router, Request, Response } from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

const router = Router();

// リクエスト時にクライアントを生成（起動時エラーを防ぐ）
function createTTSClient() {
  const credJson = process.env.GOOGLE_CREDENTIALS_JSON;
  if (credJson) {
    const credentials = JSON.parse(credJson);
    return new textToSpeech.TextToSpeechClient({ credentials });
  }
  return new textToSpeech.TextToSpeechClient();
}

// ============================================================
// POST /api/tts
// テキストをGoogle Cloud TTSで音声変換して返す
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'textが必要です' });
    }

    // 絵文字・問題番号を除去
    const cleanText = text
      .replace(/Q\d+[.．、\s]*/g, '')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'テキストが空です' });
    }

    const ttsClient = createTTSClient();
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: cleanText },
      voice: {
        languageCode: 'ja-JP',
        name: 'ja-JP-Neural2-B',  // 自然な日本語女性音声（Neural2）
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,   // 少しゆっくり（高齢者にも聞き取りやすく）
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
