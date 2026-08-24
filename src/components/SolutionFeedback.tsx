import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, MessageSquare } from 'lucide-react';
import { apiFetch } from '../lib/api-client';

interface SolutionFeedbackProps {
  solutionType: string;
  itemTitle?: string;
  userId?: string;
  className?: string;
}

export const SolutionFeedback: React.FC<SolutionFeedbackProps> = ({
  solutionType,
  itemTitle,
  userId = 'anonymous',
  className = ''
}) => {
  const [rating, setRating] = useState<'useful' | 'not_useful' | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (selectedRating: 'useful' | 'not_useful') => {
    setRating(selectedRating);
    if (selectedRating === 'not_useful') {
      setShowCommentBox(true);
      return;
    }

    // Direct submit for positive feedback
    await sendFeedback(selectedRating, '');
  };

  const sendFeedback = async (voteRating: 'useful' | 'not_useful', userComment: string) => {
    setIsSubmitting(true);
    try {
      await apiFetch('/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          solutionType,
          rating: voteRating,
          comment: userComment,
          itemTitle
        })
      });
      setSubmitted(true);
      setShowCommentBox(false);
    } catch (err) {
      console.warn('[SolutionFeedback] Error submitting feedback', err);
      // Still set submitted for positive UX
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div id="solution-feedback-thanks" className={`flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span>Obrigado pelo feedback! Isso aprimora a inteligência das próximas soluções.</span>
      </div>
    );
  }

  return (
    <div id="solution-feedback-container" className={`pt-3 border-t border-slate-100 dark:border-slate-800/60 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium flex items-center gap-1.5">
          <span>Esta solução foi útil para o seu perfil?</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-feedback-useful"
            disabled={isSubmitting}
            onClick={() => handleVote('useful')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              rating === 'useful'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Sim</span>
          </button>

          <button
            type="button"
            id="btn-feedback-not-useful"
            disabled={isSubmitting}
            onClick={() => handleVote('not_useful')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              rating === 'not_useful'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Não</span>
          </button>
        </div>
      </div>

      {showCommentBox && (
        <div className="mt-2.5 space-y-2 animate-fadeIn">
          <textarea
            id="feedback-comment-input"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que faltou ou poderia ser mais específico?"
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => sendFeedback('not_useful', comment)}
              className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
