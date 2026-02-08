import { Check, Copy } from "lucide-react";
import { useState } from "react";

export 
function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      title="Copy"
    >
      <span className="font-mono font-medium">
        #{id.slice(0, 8).toUpperCase()}
      </span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}