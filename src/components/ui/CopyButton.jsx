import { useState } from 'react';
import Button from './Button.jsx';
import { useToast } from './Toast.jsx';

export default function CopyButton({ value, label = 'Copy', variant = 'ink', size = 'md', full }) {
  const [done, setDone] = useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const t = document.createElement('textarea');
      t.value = value;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setDone(true);
    toast('Copied to clipboard');
    setTimeout(() => setDone(false), 1600);
  };

  return (
    <Button variant={done ? 'blue' : variant} size={size} full={full} onClick={copy} icon={done ? 'check' : 'copy'}>
      {done ? 'Copied!' : label}
    </Button>
  );
}
