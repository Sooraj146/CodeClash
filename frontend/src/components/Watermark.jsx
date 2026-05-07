import './Watermark.css';

const WORD = 'CodeClash';

// Container is 350vmax × 350vmax.
// On 1080p: 350 × 19.2px ≈ 6720px tall.
// Each row occupies ~30px height + 52px gap = ~82px.
// 100 rows × 82px = 8200px — covers up to 1440p (8960px) tightly.
// Words doubled so the horizontal marquee loop is seamless.
const ROW_WORDS = Array.from({ length: 20 }, () => WORD); // 20 × 2 = 40 words per row

// Speed variants so rows don't all move identically
const SPEEDS = [18, 22, 26, 20, 24];

export default function Watermark() {
  return (
    <div className="watermark-bg" aria-hidden="true">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className={`watermark-row ${i % 2 === 0 ? 'watermark-row-fwd' : 'watermark-row-rev'}`}
          style={{ animationDuration: `${SPEEDS[i % SPEEDS.length]}s` }}
        >
          {[...ROW_WORDS, ...ROW_WORDS].map((word, j) => (
            <span key={j}>{word}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
