/**
 * The server's pass for the database. The Supabase project is shared with
 * StudiCouch, whose request check (private.studicouch_check_request, set as
 * PostgREST's db_pre_request) refuses every REST request made with the public
 * key alone — for all tables in the project, Grainbuds' included. The server
 * sends the pass in a header; the secret key needs none, and Supabase auth and
 * storage are not affected.
 *
 * Server-only: never NEXT_PUBLIC_, so browser code cannot query the database
 * directly and has to go through a Server Function. Unset, it sends nothing.
 */
export function gateOptions() {
  const key = process.env.SUPABASE_GATE_KEY;
  return key ? { global: { headers: { "x-sc-gate": key } } } : {};
}
