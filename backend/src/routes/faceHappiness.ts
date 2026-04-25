import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = new Anthropic();

// POST /api/face-happiness
// body: { image: "data:image/jpeg;base64,..." }
router.post('/', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: '画像データがありません' });
    }

    // "data:image/jpeg;base64,xxxx" → メディアタイプとbase64データに分割
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: '画像フォーマットが不正です' });
    }
    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = matches[2];

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `この写真に写っている人物の表情から「幸福度」を判定してください。

以下のJSON形式のみで回答してください（他の文章は不要）：
{
  "score": 1〜5の整数,
  "label": "ラベル文字列",
  "comment": "一言コメント（20文字以内）"
}

スコア基準：
5 = とても幸せそう（満面の笑み、目も笑っている）
4 = 幸せそう（笑顔がある）
3 = ふつう（表情が穏やか・無表情）
2 = 少し元気なし（やや暗い・疲れた表情）
1 = 元気なし（悲しそう・辛そうな表情）

顔が写っていない・判定できない場合：
{ "score": 0, "label": "判定不可", "comment": "顔が認識できませんでした" }`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI応答のパースに失敗しました', raw: text });
    }
    const result = JSON.parse(jsonMatch[0]);
    return res.json(result);

  } catch (e: any) {
    console.error('face-happiness error:', e);
    return res.status(500).json({ error: 'サーバーエラーが発生しました', detail: e.message });
  }
});

export default router;
