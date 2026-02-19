import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router: Router = express.Router();

const FONT_PATH = path.join(__dirname, '../../fonts/NotoSansJP.otf');

router.get('/generate/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const interviewResult = await pool.query(
      'SELECT * FROM interviews WHERE user_id = $1 ORDER BY question_id', [user_id]
    );
    const timelineResult = await pool.query(
      'SELECT * FROM timelines WHERE user_id = $1 ORDER BY year, month', [user_id]
    );
    const photoResult = await pool.query(
      'SELECT * FROM photos WHERE user_id = $1 ORDER BY uploaded_at', [user_id]
    );

    const fontExists = fs.existsSync(FONT_PATH);

    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 70, right: 70 } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="life-memo-${user_id}.pdf"`);
    doc.pipe(res);

    const setFont = (size: number, bold: boolean = false) => {
      if (fontExists) {
        doc.font(FONT_PATH).fontSize(size);
      } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
      }
    };

    // ── 表紙 ──
    doc.moveDown(6);
    setFont(28, true);
    doc.fillColor('#5C4033').text(`${user.name} の物語`, { align: 'center' });
    doc.moveDown(0.8);
    setFont(13);
    doc.fillColor('#8B7355').text(`${user.age}歳`, { align: 'center' });
    doc.moveDown(2);
    doc.moveTo(150, doc.y).lineTo(445, doc.y).strokeColor('#C4A882').lineWidth(1).stroke();
    doc.moveDown(2);
    setFont(11);
    doc.fillColor('#AAA').text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, { align: 'center' });

    // ── あなたの物語ページ（回答のみ、一つの物語として） ──
    if (interviewResult.rows.length > 0) {
      doc.addPage();
      setFont(22, true);
      doc.fillColor('#5C4033').text('あなたの物語', { align: 'center' });
      doc.moveDown(0.4);
      setFont(11);
      doc.fillColor('#8B7355').text(`〜 ${user.name} さんの人生 〜`, { align: 'center' });
      doc.moveDown(0.8);
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor('#C4A882').lineWidth(1).stroke();
      doc.moveDown(1.5);

      // 回答だけを段落として繋げる
      const storyParagraphs = interviewResult.rows
        .filter(iv => iv.answer_text?.trim())
        .map(iv => iv.answer_text.trim());

      setFont(12);
      doc.fillColor('#2C2C2C');

      for (const paragraph of storyParagraphs) {
        doc.text(paragraph, {
          align: 'justify',
          lineGap: 5,
          paragraphGap: 0,
        });
        doc.moveDown(1.0);
        if (doc.y > 720) doc.addPage();
      }
    }

    // ── インタビュー記録（Q&A形式） ──
    if (interviewResult.rows.length > 0) {
      doc.addPage();
      setFont(18, true);
      doc.fillColor('#5C4033').text('インタビュー記録');
      doc.moveDown(0.5);
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor('#C4A882').stroke();
      doc.moveDown(0.8);

      for (const iv of interviewResult.rows) {
        setFont(11, true);
        doc.fillColor('#6B4F3A').text(`Q${iv.question_id}. ${iv.question_text}`);
        doc.moveDown(0.3);
        setFont(11);
        doc.fillColor('#333').text(iv.answer_text || '未回答', { indent: 10 });
        doc.moveDown(0.8);
        if (doc.y > 700) doc.addPage();
      }
    }

    // ── 人生年表 ──
    if (timelineResult.rows.length > 0) {
      doc.addPage();
      setFont(18, true);
      doc.fillColor('#5C4033').text('人生年表');
      doc.moveDown(0.5);
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor('#C4A882').stroke();
      doc.moveDown(0.8);

      for (const ev of timelineResult.rows) {
        const dateStr = ev.month ? `${ev.year}年${ev.month}月` : `${ev.year}年`;
        setFont(11, true);
        doc.fillColor('#8B7355').text(dateStr, { continued: true });
        doc.fillColor('#333');
        setFont(11);
        doc.text(`　${ev.event_title}`);
        if (ev.event_description) {
          setFont(10);
          doc.fillColor('#666').text(ev.event_description, { indent: 20 });
        }
        doc.moveDown(0.6);
        if (doc.y > 700) doc.addPage();
      }
    }

    // ── 思い出の写真 ──
    if (photoResult.rows.length > 0) {
      doc.addPage();
      setFont(18, true);
      doc.fillColor('#5C4033').text('思い出の写真');
      doc.moveDown(0.5);
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor('#C4A882').stroke();
      doc.moveDown(0.8);

      const uploadsDir = path.join(__dirname, '../../uploads');
      let col = 0;
      const imgW = 220, imgH = 160, gap = 15;

      for (const photo of photoResult.rows) {
        const imgPath = path.join(uploadsDir, path.basename(photo.photo_url));
        if (!fs.existsSync(imgPath)) continue;

        const x = 70 + col * (imgW + gap);
        const y = doc.y;

        try {
          doc.image(imgPath, x, y, { width: imgW, height: imgH });
          if (photo.caption) {
            setFont(9);
            doc.fillColor('#666').text(photo.caption, x, y + imgH + 4, { width: imgW, align: 'center' });
          }
        } catch (e) { /* skip */ }

        col++;
        if (col >= 2) {
          col = 0;
          doc.moveDown(12);
          if (doc.y > 650) doc.addPage();
        }
      }
    }

    doc.end();
  } catch (error: any) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
