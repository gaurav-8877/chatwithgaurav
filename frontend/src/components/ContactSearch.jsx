import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

function ContactSearch({ onSearch, placeholder = "Search contacts..." }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="p-4 border-b border-slate-700/50">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-9 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ContactSearch;
