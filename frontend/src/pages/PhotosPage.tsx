import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { photoApi, Photo } from '../api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const fieldTitles: Record<string, string> = {
  jibunshi: '思い出の写真',
  kaishashi: '会社の写真',
  shukatsu: '大切な写真',
  other: '写真',
};

export default function PhotosPage() {
  const { fieldType = 'jibunshi' } = useParams<{ fieldType: string }>();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await photoApi.getAll(user.id, fieldType);
      setPhotos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [user.id, fieldType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await photoApi.upload(user.id, selectedFile, caption || undefined, fieldType);
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      fetchPhotos();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この写真を削除しますか？')) return;
    try {
      await photoApi.delete(id);
      fetchPhotos();
    } catch (e) {
      console.error(e);
    }
  };

  const title = fieldTitles[fieldType] || '写真';

  return (
    <Layout title={`🖼 ${title}`}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius)', padding: '36px',
        marginBottom: '40px', boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)',
      }}>
        <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.1rem', marginBottom: '24px', color: 'var(--brown-dark)' }}>
          写真をアップロード
        </h3>
        <div onClick={() => fileRef.current?.click()} style={{
          border: `3px dashed ${preview ? 'var(--accent)' : 'var(--brown-light)'}`,
          borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center',
          cursor: 'pointer', background: preview ? 'rgba(200,105,74,0.04)' : 'var(--cream)',
          transition: 'all 0.2s', marginBottom: '20px',
        }}>
          {preview ? (
            <div>
              <img src={preview} alt="プレビュー" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <p style={{ color: 'var(--accent)', marginTop: '12px', fontSize: '0.9rem' }}>クリックして別の写真を選ぶ</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📷</div>
              <p style={{ color: 'var(--brown)', fontSize: '1rem', marginBottom: '8px' }}>クリックして写真を選ぶ</p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>JPEG, PNG, GIF に対応</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

        {selectedFile && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontSize: '0.9rem' }}>
                キャプション（任意）
              </label>
              <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="例: 家族旅行、昭和45年夏"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', background: 'var(--cream)', outline: 'none' }} />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{
              padding: '12px 28px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '1rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif", flexShrink: 0,
            }}>
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : photos.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '60px', textAlign: 'center', border: '2px dashed var(--cream-dark)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🖼</div>
          <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
            まだ写真がありません。<br />上のエリアから写真をアップロードしましょう。
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {photos.map(photo => (
            <div key={photo.id} className="fade-in" style={{
              background: 'var(--white)', borderRadius: 'var(--radius)', overflow: 'hidden',
              boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)', transition: 'all 0.25s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ cursor: 'pointer' }} onClick={() => setLightbox(photo)}>
                <img src={`${API_BASE}${photo.photo_url}`} alt={photo.caption || '写真'}
                  style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns%3D"http://www.w3.org/2000/svg" width%3D"200" height%3D"160" viewBox%3D"0 0 200 160"%3E%3Crect fill%3D"%23f2ebe0" width%3D"200" height%3D"160"/%3E%3Ctext fill%3D"%23c4a882" font-size%3D"40" text-anchor%3D"middle" x%3D"100" y%3D"90"%3E🖼%3C/text%3E%3C/svg%3E'; }} />
              </div>
              <div style={{ padding: '12px 14px' }}>
                {photo.caption && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.4, marginBottom: '8px' }}>{photo.caption}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--brown-light)' }}>{new Date(photo.uploaded_at).toLocaleDateString('ja-JP')}</span>
                  <button onClick={() => handleDelete(photo.id)} style={{ background: 'transparent', border: 'none', color: '#C0392B', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px' }}>削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px', cursor: 'pointer',
        }}>
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <img src={`${API_BASE}${lightbox.photo_url}`} alt={lightbox.caption || '写真'}
              style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
            {lightbox.caption && <p style={{ color: 'white', marginTop: '16px', fontSize: '1rem' }}>{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} style={{
              display: 'block', margin: '20px auto 0', padding: '10px 24px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px', color: 'white', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif",
            }}>閉じる</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
