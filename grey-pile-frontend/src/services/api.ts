// Base GraphQL fetch utility.
// Set REACT_APP_API_URL in .env.local to point at your running API.

const API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:5260/graphql';

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`API error: HTTP ${res.status}`);

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);

  return data as T;
}
