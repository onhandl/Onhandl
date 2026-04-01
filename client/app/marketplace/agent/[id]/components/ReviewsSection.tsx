'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Loader2, User, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { _id: string; name: string; avatarUrl: string | null };
}

function StarRow({ value, onChange, size = 5 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange?.(s)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-${size} h-${size} ${s <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ agentId }: { agentId: string }) {
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [total,       setTotal]       = useState(0);
  const [avgRating,   setAvgRating]   = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [canReview,   setCanReview]   = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myRating,    setMyRating]    = useState(5);
  const [myComment,   setMyComment]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [formOpen,    setFormOpen]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rev, mine] = await Promise.all([
        apiFetch(`/agents/${agentId}/reviews?limit=20`),
        apiFetch(`/agents/${agentId}/reviews/mine`).catch(() => null),
      ]);
      setReviews((rev as any).reviews || []);
      setTotal((rev as any).total || 0);
      setAvgRating((rev as any).avgRating || 0);
      if (mine) {
        setCanReview(!!(mine as any).canReview);
        setHasReviewed(!!(mine as any).hasReviewed);
        if ((mine as any).existingReview) {
          setMyRating((mine as any).existingReview.rating);
          setMyComment((mine as any).existingReview.comment || '');
        }
      }
    } catch { /* not authenticated */ }
    finally { setLoading(false); }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiFetch(`/agents/${agentId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      });
      setFormOpen(false);
      setHasReviewed(true);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRow value={Math.round(avgRating)} />
            <span className="text-sm font-bold text-zinc-200">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">({total})</span>
          </div>
        </div>
        {canReview && (
          <button onClick={() => setFormOpen(!formOpen)}
            className="text-xs font-semibold bg-[#9AB17A]/15 text-[#9AB17A] border border-[#9AB17A]/25 px-3 py-1.5 rounded-lg hover:bg-[#9AB17A]/25 transition-colors cursor-pointer">
            {hasReviewed ? 'Edit Review' : 'Write Review'}
          </button>
        )}
      </div>

      {/* Write / edit form */}
      {formOpen && canReview && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
          <div>
            <p className="text-xs text-zinc-400 mb-1.5">Your rating</p>
            <StarRow value={myRating} onChange={setMyRating} size={5} />
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Share your experience with this agent… (optional)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#9AB17A]/50"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 cursor-pointer">Cancel</button>
            <button onClick={submit} disabled={submitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#9AB17A] text-black px-4 py-1.5 rounded-lg hover:bg-[#C3CC9B] transition-colors disabled:opacity-50 cursor-pointer">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {submitting ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">No reviews yet. Be the first verified buyer to leave one.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {r.reviewer.avatarUrl
                    ? <img src={r.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <User className="w-3.5 h-3.5 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">{r.reviewer.name}</span>
                    <StarRow value={r.rating} size={3} />
                    <span className="text-[10px] text-zinc-600 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
