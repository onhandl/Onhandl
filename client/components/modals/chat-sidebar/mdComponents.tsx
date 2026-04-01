/** Shared ReactMarkdown component overrides for chat messages */
export const mdComponents: any = {
    a: ({ node, ...props }: any) => (
        <a {...props} target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline break-all" />
    ),
    code: ({ node, ...props }: any) => (
        <code {...props} className="bg-zinc-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs break-all" />
    ),
    pre: ({ node, ...props }: any) => (
        <pre {...props} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 my-2 overflow-x-auto text-xs" />
    ),
    table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-2 w-full">
            <table {...props} className="border-collapse text-xs w-full min-w-full" />
        </div>
    ),
    th: ({ node, ...props }: any) => (
        <th {...props} className="border border-zinc-700 px-3 py-1.5 bg-zinc-800 text-left text-zinc-200 whitespace-nowrap" />
    ),
    td: ({ node, ...props }: any) => (
        <td {...props} className="border border-zinc-800 px-3 py-1.5 text-zinc-300" />
    ),
    p: ({ node, ...props }: any) => (
        <p {...props} className="my-1 break-words leading-relaxed" />
    ),
    strong: ({ node, ...props }: any) => (
        <strong {...props} className="text-white font-semibold" />
    ),
};
