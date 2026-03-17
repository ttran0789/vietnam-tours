import { Review } from '../types'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'star-filled' : 'star-empty'}>&#9733;</span>
      ))}
    </span>
  )
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">
          {review.reviewer_name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="review-meta">
          <span className="review-name">{review.reviewer_name}</span>
          {review.reviewer_country && (
            <span className="review-country">{review.reviewer_country}</span>
          )}
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="review-text">{review.text}</p>
    </div>
  )
}
