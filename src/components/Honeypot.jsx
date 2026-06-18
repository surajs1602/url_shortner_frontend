// Honeypot field — invisible to humans, irresistible to bots.
// Real users never see or tab to it, so it stays empty; bots that fill the
// `website` field get silently dropped by the backend.
export default function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
