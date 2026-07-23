export interface ParsedCurl {
  endpoint: string;
  method: string;
  headers: { key: string; value: string }[];
  queryParams: { key: string; value: string }[];
  body: string;
}

function tokenize(input: string): string[] {
  // Normalize line continuations (\<newline>)
  const src = input.replace(/\\\r?\n/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;

  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;

    if (src[i] === "'") {
      i++;
      let s = "";
      while (i < src.length && src[i] !== "'") s += src[i++];
      i++; // closing quote
      tokens.push(s);
    } else if (src[i] === '"') {
      i++;
      let s = "";
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < src.length) { i++; s += src[i]; }
        else s += src[i];
        i++;
      }
      i++; // closing quote
      tokens.push(s);
    } else if (src[i] === "$" && src[i + 1] === "'") {
      // $'...' ANSI-C quoting — treat like single-quote for simplicity
      i += 2;
      let s = "";
      while (i < src.length && src[i] !== "'") {
        if (src[i] === "\\" && i + 1 < src.length) { i++; s += src[i]; }
        else s += src[i];
        i++;
      }
      i++;
      tokens.push(s);
    } else {
      let s = "";
      while (i < src.length && !/\s/.test(src[i])) s += src[i++];
      tokens.push(s);
    }
  }

  return tokens;
}

const SKIP_FLAGS = new Set([
  "--compressed", "--no-compressed",
  "-k", "--insecure",
  "-L", "--location",
  "-s", "--silent",
  "-S", "--show-error",
  "-v", "--verbose",
  "-i", "--include",
  "-I", "--head",
  "--http1.1", "--http2",
  "-g", "--globoff",
]);

// Flags that consume the next token but whose value we ignore
const SKIP_VALUE_FLAGS = new Set([
  "--max-time", "-m",
  "--connect-timeout",
  "--proxy", "-x",
  "--cacert", "--cert", "--key",
  "--output", "-o",
  "--cookie-jar", "-c",
  "--limit-rate",
  "--retry",
  "--retry-delay",
  "--user-agent", "-A",
  "--referer", "-e",
]);

export function parseCurl(curlString: string): ParsedCurl {
  const tokens = tokenize(curlString);
  let i = 0;

  // Skip the "curl" command itself
  if (tokens[i]?.toLowerCase() === "curl") i++;

  let rawUrl = "";
  let method = "";
  const headersList: { key: string; value: string }[] = [];
  let body = "";

  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok === "-X" || tok === "--request") {
      method = (tokens[++i] ?? "").toUpperCase();
    } else if (tok === "-H" || tok === "--header") {
      const raw = tokens[++i] ?? "";
      const colon = raw.indexOf(":");
      if (colon > 0) {
        headersList.push({
          key: raw.slice(0, colon).trim(),
          value: raw.slice(colon + 1).trim(),
        });
      }
    } else if (
      tok === "-d" || tok === "--data" ||
      tok === "--data-raw" || tok === "--data-binary" ||
      tok === "--data-ascii"
    ) {
      body = tokens[++i] ?? "";
    } else if (tok === "--data-urlencode") {
      // Append as-is; let the user adjust
      const chunk = tokens[++i] ?? "";
      body = body ? body + "&" + chunk : chunk;
    } else if (tok === "-u" || tok === "--user") {
      const creds = tokens[++i] ?? "";
      if (creds) {
        const encoded = btoa(creds);
        headersList.push({ key: "Authorization", value: `Basic ${encoded}` });
      }
    } else if (tok === "-b" || tok === "--cookie") {
      const cookie = tokens[++i] ?? "";
      if (cookie) {
        headersList.push({ key: "Cookie", value: cookie });
      }
    } else if (SKIP_FLAGS.has(tok)) {
      // no-op
    } else if (SKIP_VALUE_FLAGS.has(tok)) {
      i++; // consume value token
    } else if (tok.startsWith("--")) {
      // Unknown long option — if next token looks like a value, skip it
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) i++;
    } else if (tok.startsWith("-") && tok.length > 1) {
      // Unknown short flag(s) — skip
    } else if (!rawUrl) {
      rawUrl = tok;
    }

    i++;
  }

  // Parse URL into base endpoint + query params
  let endpoint = rawUrl;
  const queryParams: { key: string; value: string }[] = [];

  try {
    const url = new URL(rawUrl);
    endpoint = url.origin + url.pathname;
    url.searchParams.forEach((value, key) => {
      queryParams.push({ key, value });
    });
  } catch {
    // Not a valid URL, use as-is
  }

  if (!method) {
    method = body ? "POST" : "GET";
  }

  return { endpoint, method, headers: headersList, queryParams, body };
}
