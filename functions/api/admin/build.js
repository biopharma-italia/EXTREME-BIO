/**
 * Admin API — Build & Deploy
 * Triggers JSON export pipeline and optionally deploys
 *
 * POST /api/admin/build
 *   body: { action: 'export' | 'search' | 'full' | 'validate' | 'status' }
 * GET  /api/admin/build
 *   Returns current build status and file checksums
 */

export async function onRequestGet(context) {
  // Return current build status
  const { env } = context;

  return new Response(JSON.stringify({
    status: 'ok',
    pipeline: {
      version: '1.0.0',
      last_build: null,
      description: 'Build pipeline generates static JSON from DB. Run via admin panel or CI/CD.',
      available_actions: ['export', 'search', 'full', 'validate', 'status'],
    },
    note: 'Full pipeline runs: DB → JSON export → search index → validation. Deploy via GitHub Actions webhook.',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const action = body.action || 'status';
  const validActions = ['export', 'search', 'full', 'validate', 'status'];

  if (!validActions.includes(action)) {
    return new Response(JSON.stringify({
      error: `Invalid action. Use: ${validActions.join(', ')}`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // In production, this would trigger a GitHub Actions workflow
  // For now, return the action plan
  return new Response(JSON.stringify({
    status: 'accepted',
    action,
    message: `Build action "${action}" queued. In production, this triggers GitHub Actions.`,
    pipeline_steps: action === 'full' ? [
      '1. Export DB → JSON (specialties, physicians, procedures, lab_tests, packs, pathways)',
      '2. Rebuild search index (terms, aliases)',
      '3. Regenerate unified-entities.json',
      '4. Validate all output files',
      '5. Deploy to Cloudflare Pages (if validation passes)',
    ] : [`Run: python3 admin/scripts/build_pipeline.py ${action}`],
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
