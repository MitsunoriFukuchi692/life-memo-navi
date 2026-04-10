import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// POST /api/tts
// テキストをOpenAI TTSで音声変換して返す
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

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',    // 明るくかわいい女性の声
      input: cleanText,
      speed: 0.9,       // 少しゆっくり
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    console.error('TTS エラー:', err);
    res.status(500).json({ error: 'TTS変換に失敗しました' });
  }
});

export default router;
