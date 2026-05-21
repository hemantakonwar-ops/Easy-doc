'use client';

interface SummaryProps {
  text: string;
  maxLength?: number;
}

export default function Summary({ text, maxLength = 500 }: SummaryProps) {
  const summary = text.length > maxLength 
    ? text.slice(0, maxLength) + '...' 
    : text;

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h3 className="font-semibold mb-2">Document Summary</h3>
      <p className="text-gray-700">{summary}</p>
    </div>
  );
}
