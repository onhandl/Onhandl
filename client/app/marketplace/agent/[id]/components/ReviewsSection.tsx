'use client';

import { useState, useEffect, useCallback } from 'react';
import { IconStar, IconLoader2, IconUser, IconSend } from '@tabler/icons-react';
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
          <IconStar className={`w-${size} h-${size} ${s <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
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
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRow value={Math.round(avgRating)} />
            <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({total})</span>
          </div>
        </div>
        {canReview && (
          <button onClick={() => setFormOpen(!formOpen)}
            className="text-xs font-semibold bg-primary/10 text-primary border border-primary/25 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer">
            {hasReviewed ? 'Edit Review' : 'Write Review'}
          </button>
        )}
      </div>

      {/* Write / edit form */}
      {formOpen && canReview && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Your rating</p>
            <StarRow value={myRating} onChange={setMyRating} size={5} />
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Share your experience with this agent… (optional)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 cursor-pointer transition-colors">Cancel</button>
            <button onClick={submit} disabled={submitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer">
              {submitting ? <IconLoader2 className="w-3 h-3 animate-spin" /> : <IconSend className="w-3 h-3" />}
              {submitting ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center py-6"><IconLoader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No reviews yet. Be the first verified buyer to leave one.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {r.reviewer.avatarUrl
                    ? <img src={r.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <IconUser className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{r.reviewer.name}</span>
                    <StarRow value={r.rating} size={3} />
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
